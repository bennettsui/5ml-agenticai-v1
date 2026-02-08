"""
R2 / S3-compatible object storage helper.

Uses boto3 to generate presigned URLs, upload objects, and delete objects
from Cloudflare R2 (or any S3-compatible store).
"""

from __future__ import annotations

import logging
from typing import Optional

import boto3
from botocore.config import Config as BotoConfig
from botocore.exceptions import ClientError

from app.config import settings

logger = logging.getLogger(__name__)

_client: Optional[boto3.client] = None


def _get_s3_client():
    """Lazy-initialise a shared boto3 S3 client."""
    global _client
    if _client is None:
        _client = boto3.client(
            "s3",
            endpoint_url=settings.R2_ENDPOINT or None,
            aws_access_key_id=settings.R2_ACCESS_KEY or None,
            aws_secret_access_key=settings.R2_SECRET_KEY or None,
            config=BotoConfig(
                signature_version="s3v4",
                retries={"max_attempts": 3, "mode": "standard"},
            ),
            region_name="auto",
        )
    return _client


def generate_presigned_upload_url(
    bucket: str,
    key: str,
    content_type: str = "application/octet-stream",
    expires_in: int = 3600,
) -> str:
    """Return a presigned PUT URL for uploading an object."""
    client = _get_s3_client()
    try:
        url = client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": bucket,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=expires_in,
        )
        return url
    except ClientError as exc:
        logger.error("Failed to generate presigned upload URL: %s", exc)
        raise


def generate_presigned_download_url(
    bucket: str,
    key: str,
    expires_in: int = 3600,
) -> str:
    """Return a presigned GET URL for downloading an object."""
    client = _get_s3_client()
    try:
        url = client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=expires_in,
        )
        return url
    except ClientError as exc:
        logger.error("Failed to generate presigned download URL: %s", exc)
        raise


def upload_file(
    bucket: str,
    key: str,
    body: bytes,
    content_type: str = "application/octet-stream",
) -> str:
    """Upload bytes to S3/R2 and return the object key."""
    client = _get_s3_client()
    try:
        client.put_object(
            Bucket=bucket,
            Key=key,
            Body=body,
            ContentType=content_type,
        )
        return key
    except ClientError as exc:
        logger.error("Failed to upload file %s/%s: %s", bucket, key, exc)
        raise


def delete_file(bucket: str, key: str) -> None:
    """Delete a single object from S3/R2."""
    client = _get_s3_client()
    try:
        client.delete_object(Bucket=bucket, Key=key)
    except ClientError as exc:
        logger.error("Failed to delete file %s/%s: %s", bucket, key, exc)
        raise


def delete_files(bucket: str, keys: list[str]) -> None:
    """Bulk-delete objects from S3/R2."""
    if not keys:
        return
    client = _get_s3_client()
    try:
        client.delete_objects(
            Bucket=bucket,
            Delete={"Objects": [{"Key": k} for k in keys], "Quiet": True},
        )
    except ClientError as exc:
        logger.error("Failed to bulk-delete files from %s: %s", bucket, exc)
        raise
