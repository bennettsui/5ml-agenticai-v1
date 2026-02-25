--
-- PostgreSQL database dump
--


-- Dumped from database version 17.4 - Percona Server for PostgreSQL 17.4.1
-- Dumped by pg_dump version 17.7 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: pg_stat_monitor; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_monitor WITH SCHEMA public;


--
-- Name: EXTENSION pg_stat_monitor; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_monitor IS 'The pg_stat_monitor is a PostgreSQL Query Performance Monitoring tool, based on PostgreSQL contrib module pg_stat_statements. pg_stat_monitor provides aggregated statistics, client information, plan details including plan, and histogram information.';


--
-- Name: pgaudit; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgaudit WITH SCHEMA public;


--
-- Name: EXTENSION pgaudit; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgaudit IS 'provides auditing functionality';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(username text) RETURNS TABLE(username text, password text)
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $_$
  SELECT rolname::TEXT, rolpassword::TEXT
  FROM pg_catalog.pg_authid
  WHERE pg_authid.rolname = $1
    AND pg_authid.rolcanlogin
    AND NOT pg_authid.rolsuper
    AND NOT pg_authid.rolreplication
    AND pg_authid.rolname <> '_crunchypgbouncer'
    AND (pg_authid.rolvaliduntil IS NULL OR pg_authid.rolvaliduntil >= CURRENT_TIMESTAMP)$_$;


--
-- Name: calculate_retention_date(date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_retention_date(receipt_date date) RETURNS date
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
  RETURN DATE_TRUNC('year', receipt_date) + INTERVAL '7 years' + INTERVAL '11 months' + INTERVAL '30 days';
END;
$$;


--
-- Name: cleanup_old_logs(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_old_logs() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM processing_logs
  WHERE
    created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;


--
-- Name: detect_duplicates(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.detect_duplicates(p_receipt_id uuid) RETURNS TABLE(duplicate_id uuid, similarity_score numeric, match_type character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    r2.receipt_id AS duplicate_id,
    CASE
      WHEN r1.image_hash = r2.image_hash THEN 1.00
      WHEN r1.vendor = r2.vendor
      AND r1.receipt_date = r2.receipt_date
      AND ABS(r1.amount - r2.amount) < 0.01 THEN 0.95
      WHEN r1.vendor = r2.vendor
      AND r1.receipt_date = r2.receipt_date
      AND ABS(r1.amount - r2.amount) / r1.amount < 0.05 THEN 0.85
      ELSE 0.00
    END AS similarity_score,
    CASE
      WHEN r1.image_hash = r2.image_hash THEN 'exact_hash'
      WHEN r1.vendor = r2.vendor
      AND r1.receipt_date = r2.receipt_date
      AND ABS(r1.amount - r2.amount) < 0.01 THEN 'exact_match'
      ELSE 'similar_match'
    END AS match_type
  FROM
    receipts r1
    JOIN receipts r2 ON r1.batch_id = r2.batch_id
    AND r1.receipt_id != r2.receipt_id
  WHERE
    r1.receipt_id = p_receipt_id
    AND (
      r1.image_hash = r2.image_hash
      OR (
        r1.vendor = r2.vendor
        AND r1.receipt_date = r2.receipt_date
        AND ABS(r1.amount - r2.amount) / r1.amount < 0.05
      )
    )
  ORDER BY
    similarity_score DESC;
END;
$$;


--
-- Name: update_batch_statistics(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_batch_statistics() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE
    receipt_batches
  SET
    processed_receipts = (
      SELECT
        COUNT(*)
      FROM
        receipts
      WHERE
        batch_id = NEW.batch_id
    ),
    total_amount = (
      SELECT
        COALESCE(SUM(amount), 0)
      FROM
        receipts
      WHERE
        batch_id = NEW.batch_id
    ),
    deductible_amount = (
      SELECT
        COALESCE(SUM(deductible_amount), 0)
      FROM
        receipts
      WHERE
        batch_id = NEW.batch_id
    ),
    non_deductible_amount = (
      SELECT
        COALESCE(SUM(non_deductible_amount), 0)
      FROM
        receipts
      WHERE
        batch_id = NEW.batch_id
    ),
    updated_at = NOW()
  WHERE
    batch_id = NEW.batch_id;
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ads_adsets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ads_adsets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    platform text NOT NULL,
    tenant_id text NOT NULL,
    account_id text NOT NULL,
    campaign_id text NOT NULL,
    adset_id text NOT NULL,
    adset_name text NOT NULL,
    status text,
    effective_status text,
    optimization_goal text,
    billing_event text,
    bid_strategy text,
    bid_amount numeric(18,4),
    daily_budget numeric(18,4),
    lifetime_budget numeric(18,4),
    targeting jsonb,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    created_time timestamp with time zone,
    updated_time timestamp with time zone,
    raw_data jsonb,
    synced_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ads_campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ads_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    platform text NOT NULL,
    tenant_id text NOT NULL,
    account_id text NOT NULL,
    campaign_id text NOT NULL,
    campaign_name text NOT NULL,
    objective text,
    status text,
    effective_status text,
    buying_type text,
    bid_strategy text,
    daily_budget numeric(18,4),
    lifetime_budget numeric(18,4),
    budget_remaining numeric(18,4),
    start_time timestamp with time zone,
    stop_time timestamp with time zone,
    created_time timestamp with time zone,
    updated_time timestamp with time zone,
    raw_data jsonb,
    synced_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ads_creatives; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ads_creatives (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    platform text NOT NULL,
    tenant_id text NOT NULL,
    account_id text NOT NULL,
    ad_id text NOT NULL,
    ad_name text,
    adset_id text,
    campaign_id text,
    creative_id text,
    creative_name text,
    title text,
    body text,
    description text,
    image_url text,
    thumbnail_url text,
    video_id text,
    link_url text,
    call_to_action_type text,
    status text,
    effective_status text,
    raw_creative jsonb,
    raw_ad jsonb,
    synced_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ads_daily_performance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ads_daily_performance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    platform text NOT NULL,
    tenant_id text DEFAULT '5ml-internal'::text NOT NULL,
    account_id text NOT NULL,
    campaign_id text NOT NULL,
    campaign_name text NOT NULL,
    date date NOT NULL,
    impressions bigint DEFAULT 0 NOT NULL,
    reach bigint,
    clicks bigint DEFAULT 0 NOT NULL,
    spend numeric(18,4) DEFAULT 0 NOT NULL,
    conversions numeric(18,4),
    revenue numeric(18,4),
    cpc numeric(18,4),
    cpm numeric(18,4),
    ctr numeric(10,6),
    roas numeric(10,6),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    ad_id text DEFAULT ''::text NOT NULL,
    ad_name text DEFAULT ''::text NOT NULL
);


--
-- Name: analyses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analyses (
    id integer NOT NULL,
    project_id uuid NOT NULL,
    agent_type character varying(50),
    analysis_data jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: analyses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.analyses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: analyses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.analyses_id_seq OWNED BY public.analyses.id;


--
-- Name: brand_products_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brand_products_services (
    id integer NOT NULL,
    product_service_id uuid DEFAULT gen_random_uuid(),
    brand_id uuid NOT NULL,
    name character varying(500) NOT NULL,
    category character varying(100),
    description text,
    type character varying(50),
    status character varying(50) DEFAULT 'active'::character varying,
    launch_date date,
    discontinue_date date,
    portfolio_order integer,
    image_url text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: brand_products_services_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.brand_products_services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: brand_products_services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.brand_products_services_id_seq OWNED BY public.brand_products_services.id;


--
-- Name: brands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brands (
    id integer NOT NULL,
    brand_id uuid DEFAULT gen_random_uuid(),
    brand_name character varying(255) NOT NULL,
    normalized_name character varying(255) NOT NULL,
    industry character varying(255),
    brand_info jsonb DEFAULT '{}'::jsonb,
    last_analysis jsonb,
    agent_results jsonb DEFAULT '{}'::jsonb,
    usage_count integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: brands_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.brands_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: brands_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.brands_id_seq OWNED BY public.brands.id;


--
-- Name: category_statistics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.category_statistics (
    id integer NOT NULL,
    batch_id uuid NOT NULL,
    category_id character varying(10) NOT NULL,
    category_name character varying(100) NOT NULL,
    receipt_count integer DEFAULT 0 NOT NULL,
    total_amount numeric(12,2) DEFAULT 0 NOT NULL,
    deductible_amount numeric(12,2) DEFAULT 0 NOT NULL,
    non_deductible_amount numeric(12,2) DEFAULT 0 NOT NULL,
    percent_of_total numeric(5,2) DEFAULT 0,
    avg_confidence numeric(3,2),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE category_statistics; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.category_statistics IS 'Aggregate category performance metrics';


--
-- Name: category_statistics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.category_statistics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: category_statistics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.category_statistics_id_seq OWNED BY public.category_statistics.id;


--
-- Name: client_credentials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id text NOT NULL,
    service text NOT NULL,
    account_id text NOT NULL,
    access_token text,
    refresh_token text,
    extra jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    conversation_id uuid DEFAULT gen_random_uuid(),
    brand_name character varying(255) NOT NULL,
    agent_type character varying(50) NOT NULL,
    initial_brief text,
    messages jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: crm_clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(300) NOT NULL,
    legal_name character varying(300),
    industry jsonb DEFAULT '[]'::jsonb,
    region jsonb DEFAULT '[]'::jsonb,
    status character varying(50) DEFAULT 'prospect'::character varying,
    website_url character varying(500),
    company_size character varying(50),
    client_value_tier character varying(1),
    health_score integer DEFAULT 50,
    internal_notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: crm_contact_project_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_contact_project_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contact_id uuid,
    project_id uuid,
    role character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: crm_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid,
    name character varying(300) NOT NULL,
    email character varying(255),
    phone character varying(50),
    title character varying(200),
    department character varying(100),
    linkedin_url character varying(500),
    linkedin_data jsonb DEFAULT '{}'::jsonb,
    research_data jsonb DEFAULT '{}'::jsonb,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: crm_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid,
    project_id uuid,
    source character varying(50) DEFAULT 'other'::character varying,
    date date DEFAULT CURRENT_DATE,
    raw_text text NOT NULL,
    sentiment character varying(20),
    sentiment_score integer,
    topics jsonb DEFAULT '[]'::jsonb,
    severity character varying(20),
    status character varying(50) DEFAULT 'new'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: crm_gmail_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_gmail_tokens (
    id integer NOT NULL,
    email character varying(255),
    access_token text,
    refresh_token text,
    token_expiry timestamp without time zone,
    last_sync_at timestamp without time zone,
    total_synced integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: crm_gmail_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.crm_gmail_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: crm_gmail_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.crm_gmail_tokens_id_seq OWNED BY public.crm_gmail_tokens.id;


--
-- Name: crm_projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid,
    name character varying(300) NOT NULL,
    type character varying(50) DEFAULT 'other'::character varying,
    brief text,
    start_date date,
    end_date date,
    status character varying(50) DEFAULT 'planning'::character varying,
    success_flag character varying(50),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: duplicate_receipts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.duplicate_receipts (
    id integer NOT NULL,
    receipt_id_1 uuid NOT NULL,
    receipt_id_2 uuid NOT NULL,
    similarity_score numeric(3,2) NOT NULL,
    match_type character varying(50) NOT NULL,
    flagged_at timestamp without time zone DEFAULT now(),
    resolved boolean DEFAULT false,
    resolved_by character varying(255),
    resolved_at timestamp without time zone,
    resolution_notes text
);


--
-- Name: TABLE duplicate_receipts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.duplicate_receipts IS 'Potential duplicate receipt pairs';


--
-- Name: duplicate_receipts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.duplicate_receipts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: duplicate_receipts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.duplicate_receipts_id_seq OWNED BY public.duplicate_receipts.id;


--
-- Name: growth_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.growth_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brand_name character varying(255) NOT NULL,
    plan_id uuid,
    experiment_id uuid,
    asset_type character varying(100) NOT NULL,
    channel character varying(100),
    funnel_stage character varying(100),
    tag character varying(100),
    content jsonb NOT NULL,
    status character varying(50) DEFAULT 'draft'::character varying,
    performance jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: growth_crm_flows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.growth_crm_flows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brand_name character varying(255) NOT NULL,
    plan_id uuid,
    flow_name character varying(255) NOT NULL,
    trigger_event character varying(255),
    audience_segment character varying(255),
    flow_steps jsonb DEFAULT '[]'::jsonb NOT NULL,
    status character varying(50) DEFAULT 'draft'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: growth_edm_campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.growth_edm_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brand_name character varying(255) NOT NULL,
    plan_id uuid,
    campaign_name character varying(255) NOT NULL,
    campaign_type character varying(100),
    subject character varying(500) NOT NULL,
    preview_text text,
    html_content text NOT NULL,
    recipients jsonb DEFAULT '[]'::jsonb,
    scheduled_at timestamp with time zone,
    sent_at timestamp with time zone,
    open_rate numeric(10,6),
    click_rate numeric(10,6),
    status character varying(50) DEFAULT 'draft'::character varying,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: growth_experiments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.growth_experiments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid,
    brand_name character varying(255) NOT NULL,
    hypothesis text NOT NULL,
    channel character varying(100),
    status character varying(50) DEFAULT 'pending'::character varying,
    result_data jsonb,
    tags text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: growth_kb; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.growth_kb (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brand_name character varying(255) NOT NULL,
    category character varying(50) NOT NULL,
    title character varying(500) NOT NULL,
    content text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    embedding public.vector(1536),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: growth_metrics_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.growth_metrics_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brand_name character varying(255) NOT NULL,
    snapshot_date date NOT NULL,
    channel character varying(100),
    ctr numeric(10,6),
    cpc numeric(18,4),
    cvr numeric(10,6),
    cpa numeric(18,4),
    roas numeric(10,6),
    cac numeric(18,4),
    ltv numeric(18,4),
    spend numeric(18,4),
    revenue numeric(18,4),
    raw_data jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: growth_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.growth_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brand_name character varying(255) NOT NULL,
    plan_data jsonb NOT NULL,
    status character varying(50) DEFAULT 'draft'::character varying,
    phase character varying(50) DEFAULT 'pmf'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: growth_roas_models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.growth_roas_models (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brand_name character varying(255) NOT NULL,
    plan_id uuid,
    base_spend numeric(18,4) NOT NULL,
    base_revenue numeric(18,4) NOT NULL,
    base_roas numeric(10,6),
    channel_mix jsonb NOT NULL,
    scaling_assumptions jsonb DEFAULT '{}'::jsonb,
    projections jsonb DEFAULT '{}'::jsonb,
    ltv_assumptions jsonb DEFAULT '{}'::jsonb,
    break_even_spend numeric(18,4),
    status character varying(50) DEFAULT 'draft'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: growth_weekly_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.growth_weekly_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brand_name character varying(255) NOT NULL,
    plan_id uuid,
    week_start date NOT NULL,
    week_end date NOT NULL,
    summary jsonb NOT NULL,
    human_decisions jsonb,
    status character varying(50) DEFAULT 'pending'::character varying,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: intelligence_edm_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intelligence_edm_history (
    id integer NOT NULL,
    edm_id uuid DEFAULT gen_random_uuid(),
    topic_id uuid,
    subject character varying(500),
    preview_text text,
    html_content text,
    recipients jsonb DEFAULT '[]'::jsonb,
    articles_included integer,
    status character varying(50) DEFAULT 'sent'::character varying,
    resend_id character varying(100),
    sent_at timestamp without time zone DEFAULT now()
);


--
-- Name: intelligence_edm_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.intelligence_edm_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: intelligence_edm_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.intelligence_edm_history_id_seq OWNED BY public.intelligence_edm_history.id;


--
-- Name: intelligence_news; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intelligence_news (
    id integer NOT NULL,
    news_id uuid DEFAULT gen_random_uuid(),
    topic_id uuid,
    source_id uuid,
    title text NOT NULL,
    url text,
    summary text,
    importance_score integer,
    dimensions jsonb,
    published_at timestamp without time zone,
    scraped_at timestamp without time zone DEFAULT now(),
    status character varying(50) DEFAULT 'new'::character varying
);


--
-- Name: intelligence_news_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.intelligence_news_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: intelligence_news_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.intelligence_news_id_seq OWNED BY public.intelligence_news.id;


--
-- Name: intelligence_sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intelligence_sources (
    id integer NOT NULL,
    source_id uuid DEFAULT gen_random_uuid(),
    topic_id uuid,
    name character varying(500) NOT NULL,
    title text,
    source_type character varying(100),
    primary_url text NOT NULL,
    secondary_urls jsonb DEFAULT '[]'::jsonb,
    content_types jsonb DEFAULT '[]'::jsonb,
    posting_frequency character varying(50),
    focus_areas jsonb DEFAULT '[]'::jsonb,
    authority_score integer DEFAULT 50,
    why_selected text,
    freshness character varying(100),
    priority character varying(50) DEFAULT 'medium'::character varying,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: intelligence_sources_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.intelligence_sources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: intelligence_sources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.intelligence_sources_id_seq OWNED BY public.intelligence_sources.id;


--
-- Name: intelligence_summaries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intelligence_summaries (
    id integer NOT NULL,
    summary_id uuid DEFAULT gen_random_uuid(),
    topic_id uuid,
    breaking_news jsonb DEFAULT '[]'::jsonb,
    practical_tips jsonb DEFAULT '[]'::jsonb,
    key_points jsonb DEFAULT '[]'::jsonb,
    overall_trend text,
    model_used character varying(100),
    input_tokens integer,
    output_tokens integer,
    estimated_cost numeric(10,8),
    articles_analyzed integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: intelligence_summaries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.intelligence_summaries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: intelligence_summaries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.intelligence_summaries_id_seq OWNED BY public.intelligence_summaries.id;


--
-- Name: intelligence_topics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intelligence_topics (
    id integer NOT NULL,
    topic_id uuid DEFAULT gen_random_uuid(),
    name character varying(500) NOT NULL,
    keywords jsonb DEFAULT '[]'::jsonb,
    status character varying(50) DEFAULT 'active'::character varying,
    daily_scan_config jsonb DEFAULT '{"time": "06:00", "enabled": true, "timezone": "Asia/Hong_Kong"}'::jsonb,
    weekly_digest_config jsonb DEFAULT '{"day": "monday", "time": "08:00", "enabled": true, "timezone": "Asia/Hong_Kong", "recipientList": []}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    objectives text
);


--
-- Name: intelligence_topics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.intelligence_topics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: intelligence_topics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.intelligence_topics_id_seq OWNED BY public.intelligence_topics.id;


--
-- Name: media_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_assets (
    id integer NOT NULL,
    project_id integer,
    prompt_id integer,
    type character varying(50) NOT NULL,
    url text,
    metadata_json jsonb DEFAULT '{}'::jsonb,
    qc_json jsonb,
    status character varying(50) DEFAULT 'pending_review'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: media_assets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.media_assets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: media_assets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.media_assets_id_seq OWNED BY public.media_assets.id;


--
-- Name: media_projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_projects (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    client character varying(255),
    notes text,
    brief_text text,
    brief_spec_json jsonb,
    status character varying(100) DEFAULT 'brief_pending'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: media_projects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.media_projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: media_projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.media_projects_id_seq OWNED BY public.media_projects.id;


--
-- Name: media_prompts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_prompts (
    id integer NOT NULL,
    project_id integer,
    deliverable_type character varying(50),
    format character varying(100),
    prompt_json jsonb,
    image_workflow_json jsonb,
    video_workflow_json jsonb,
    qc_json jsonb,
    status character varying(50) DEFAULT 'draft'::character varying,
    version character varying(20) DEFAULT 'v1.0'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: media_prompts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.media_prompts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: media_prompts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.media_prompts_id_seq OWNED BY public.media_prompts.id;


--
-- Name: media_style_guides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_style_guides (
    id integer NOT NULL,
    project_id integer,
    guide_json jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: media_style_guides_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.media_style_guides_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: media_style_guides_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.media_style_guides_id_seq OWNED BY public.media_style_guides.id;


--
-- Name: meta_page_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meta_page_tokens (
    id integer NOT NULL,
    page_id character varying(64) NOT NULL,
    page_name character varying(255),
    access_token text NOT NULL,
    token_source character varying(100),
    fetched_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: meta_page_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.meta_page_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: meta_page_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.meta_page_tokens_id_seq OWNED BY public.meta_page_tokens.id;


--
-- Name: photo_booth_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.photo_booth_analytics (
    id integer NOT NULL,
    event_id uuid,
    date date NOT NULL,
    total_sessions integer DEFAULT 0,
    completed_count integer DEFAULT 0,
    failed_count integer DEFAULT 0,
    avg_generation_time_ms integer,
    theme_distribution_json jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: photo_booth_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.photo_booth_analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: photo_booth_analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.photo_booth_analytics_id_seq OWNED BY public.photo_booth_analytics.id;


--
-- Name: photo_booth_errors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.photo_booth_errors (
    id integer NOT NULL,
    error_id uuid DEFAULT gen_random_uuid(),
    session_id uuid,
    error_code character varying(50) NOT NULL,
    error_message text NOT NULL,
    agent_name character varying(100),
    input_params jsonb,
    stack_trace text,
    recovery_action character varying(100),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: photo_booth_errors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.photo_booth_errors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: photo_booth_errors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.photo_booth_errors_id_seq OWNED BY public.photo_booth_errors.id;


--
-- Name: photo_booth_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.photo_booth_events (
    id integer NOT NULL,
    event_id uuid DEFAULT gen_random_uuid(),
    name character varying(255) NOT NULL,
    brand_name character varying(255),
    logo_path text,
    hashtag character varying(100),
    metadata_json jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: photo_booth_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.photo_booth_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: photo_booth_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.photo_booth_events_id_seq OWNED BY public.photo_booth_events.id;


--
-- Name: photo_booth_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.photo_booth_images (
    id integer NOT NULL,
    image_id uuid DEFAULT gen_random_uuid(),
    session_id uuid,
    image_type character varying(20) NOT NULL,
    image_path text NOT NULL,
    image_hash character varying(64),
    theme character varying(100),
    comfyui_prompt text,
    generation_time_ms integer,
    quality_check_json jsonb,
    metadata_json jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: photo_booth_images_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.photo_booth_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: photo_booth_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.photo_booth_images_id_seq OWNED BY public.photo_booth_images.id;


--
-- Name: photo_booth_qr_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.photo_booth_qr_codes (
    id integer NOT NULL,
    qr_id uuid DEFAULT gen_random_uuid(),
    session_id uuid,
    image_id uuid,
    qr_code_path text,
    short_link character varying(255),
    download_link text,
    share_link text,
    scan_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: photo_booth_qr_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.photo_booth_qr_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: photo_booth_qr_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.photo_booth_qr_codes_id_seq OWNED BY public.photo_booth_qr_codes.id;


--
-- Name: photo_booth_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.photo_booth_sessions (
    id integer NOT NULL,
    session_id uuid DEFAULT gen_random_uuid(),
    event_id uuid,
    user_consent boolean DEFAULT false,
    language character varying(10) DEFAULT 'en'::character varying,
    theme_selected character varying(100),
    analysis_json jsonb,
    status character varying(50) DEFAULT 'created'::character varying,
    error_code character varying(50),
    error_message text,
    created_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: photo_booth_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.photo_booth_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: photo_booth_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.photo_booth_sessions_id_seq OWNED BY public.photo_booth_sessions.id;


--
-- Name: photo_booth_themes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.photo_booth_themes (
    id integer NOT NULL,
    theme_id character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    country character varying(100),
    description text,
    era character varying(100),
    image_url text,
    prompt text NOT NULL,
    is_enabled boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: photo_booth_themes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.photo_booth_themes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: photo_booth_themes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.photo_booth_themes_id_seq OWNED BY public.photo_booth_themes.id;


--
-- Name: pnl_learning_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pnl_learning_data (
    id integer NOT NULL,
    learning_id uuid DEFAULT gen_random_uuid(),
    client_name character varying(255) NOT NULL,
    source_file text,
    category_id character varying(10) NOT NULL,
    category_name character varying(100) NOT NULL,
    description_patterns text[],
    vendor_patterns text[],
    amount_range_min numeric(12,2),
    amount_range_max numeric(12,2),
    frequency_score numeric(3,2),
    embedding public.vector(384),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE pnl_learning_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.pnl_learning_data IS 'Phase 2: P&L learning data with vector embeddings';


--
-- Name: pnl_learning_data_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pnl_learning_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pnl_learning_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pnl_learning_data_id_seq OWNED BY public.pnl_learning_data.id;


--
-- Name: processing_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.processing_logs (
    id integer NOT NULL,
    batch_id uuid,
    receipt_id uuid,
    log_level character varying(20) NOT NULL,
    step character varying(100) NOT NULL,
    message text NOT NULL,
    details jsonb,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE processing_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.processing_logs IS 'Detailed processing logs for debugging';


--
-- Name: processing_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.processing_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: processing_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.processing_logs_id_seq OWNED BY public.processing_logs.id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    project_id uuid DEFAULT gen_random_uuid(),
    client_name character varying(255) NOT NULL,
    brief text,
    industry character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    title character varying(255),
    purpose text,
    deliverable text,
    background text
);


--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: radiance_blog_cms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.radiance_blog_cms (
    slug text NOT NULL,
    title_en text,
    title_zh text,
    date_en text,
    date_zh text,
    category_en text,
    category_zh text,
    read_time text,
    excerpt_en text,
    excerpt_zh text,
    hero_image text,
    content_en text,
    content_zh text,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: radiance_case_study_cms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.radiance_case_study_cms (
    slug text NOT NULL,
    title_en text,
    title_zh text,
    client text,
    excerpt_en text,
    excerpt_zh text,
    featured_image text,
    content_html_en text,
    content_html_zh text,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: radiance_enquiries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.radiance_enquiries (
    id integer NOT NULL,
    enquiry_id text DEFAULT ((('ENQ-'::text || to_char(now(), 'YYYYMMDD'::text)) || '-'::text) || substr(md5((random())::text), 1, 6)),
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    company text,
    industry text,
    service_interest text,
    message text,
    source_lang text DEFAULT 'en'::text,
    status text DEFAULT 'new'::text,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: radiance_enquiries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.radiance_enquiries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: radiance_enquiries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.radiance_enquiries_id_seq OWNED BY public.radiance_enquiries.id;


--
-- Name: radiance_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.radiance_media (
    id integer NOT NULL,
    filename text NOT NULL,
    original_name text,
    url text NOT NULL,
    mime_type text,
    size integer,
    uploaded_at timestamp with time zone DEFAULT now()
);


--
-- Name: radiance_media_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.radiance_media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: radiance_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.radiance_media_id_seq OWNED BY public.radiance_media.id;


--
-- Name: raw_tender_captures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.raw_tender_captures (
    capture_id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_id text NOT NULL,
    raw_format text DEFAULT 'rss_xml'::text NOT NULL,
    raw_payload text NOT NULL,
    pre_extracted jsonb,
    item_url text,
    item_guid text,
    captured_at timestamp with time zone DEFAULT now() NOT NULL,
    normalised boolean DEFAULT false NOT NULL,
    normalised_tender_id uuid,
    mapping_version text
);


--
-- Name: receipt_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.receipt_batches (
    id integer NOT NULL,
    batch_id uuid DEFAULT gen_random_uuid(),
    client_name character varying(255) NOT NULL,
    dropbox_url text,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    total_receipts integer DEFAULT 0,
    processed_receipts integer DEFAULT 0,
    failed_receipts integer DEFAULT 0,
    total_amount numeric(12,2) DEFAULT 0,
    deductible_amount numeric(12,2) DEFAULT 0,
    non_deductible_amount numeric(12,2) DEFAULT 0,
    period_start date,
    period_end date,
    excel_file_path text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone
);


--
-- Name: TABLE receipt_batches; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.receipt_batches IS 'Tracks batch processing of receipts from Dropbox folders';


--
-- Name: receipt_batches_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.receipt_batches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: receipt_batches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.receipt_batches_id_seq OWNED BY public.receipt_batches.id;


--
-- Name: receipts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.receipts (
    id integer NOT NULL,
    receipt_id uuid DEFAULT gen_random_uuid(),
    batch_id uuid NOT NULL,
    image_path text NOT NULL,
    image_hash character varying(64),
    receipt_date date NOT NULL,
    vendor character varying(255) NOT NULL,
    description text,
    amount numeric(12,2) NOT NULL,
    currency character varying(3) DEFAULT 'HKD'::character varying NOT NULL,
    tax_amount numeric(12,2) DEFAULT 0,
    receipt_number character varying(100),
    payment_method character varying(50),
    ocr_confidence numeric(3,2),
    ocr_warnings text[],
    ocr_raw_text text,
    category_id character varying(10) NOT NULL,
    category_name character varying(100) NOT NULL,
    categorization_confidence numeric(3,2),
    categorization_reasoning text,
    deductible boolean DEFAULT true,
    deductible_amount numeric(12,2) NOT NULL,
    non_deductible_amount numeric(12,2) DEFAULT 0,
    compliance_warnings text[],
    compliance_errors text[],
    requires_review boolean DEFAULT false,
    reviewed boolean DEFAULT false,
    reviewed_by character varying(255),
    reviewed_at timestamp without time zone,
    retention_until date,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    ocr_boxes jsonb
);


--
-- Name: TABLE receipts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.receipts IS 'Individual receipt records with OCR and categorization';


--
-- Name: receipts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.receipts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: receipts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.receipts_id_seq OWNED BY public.receipts.id;


--
-- Name: recruitai_chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recruitai_chat_messages (
    id integer NOT NULL,
    session_id uuid NOT NULL,
    role character varying(20) NOT NULL,
    content text NOT NULL,
    turn_number integer,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT recruitai_chat_messages_role_check CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'assistant'::character varying])::text[])))
);


--
-- Name: recruitai_chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recruitai_chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recruitai_chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recruitai_chat_messages_id_seq OWNED BY public.recruitai_chat_messages.id;


--
-- Name: recruitai_chat_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recruitai_chat_sessions (
    id integer NOT NULL,
    session_id uuid DEFAULT gen_random_uuid(),
    visitor_id character varying(255),
    lead_id uuid,
    industry character varying(100),
    source_page character varying(255),
    turn_count integer DEFAULT 0,
    contact_captured boolean DEFAULT false,
    captured_name text,
    captured_email text,
    captured_phone text,
    summary text,
    ip_address character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: recruitai_chat_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recruitai_chat_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recruitai_chat_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recruitai_chat_sessions_id_seq OWNED BY public.recruitai_chat_sessions.id;


--
-- Name: recruitai_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recruitai_leads (
    id integer NOT NULL,
    lead_id uuid DEFAULT gen_random_uuid(),
    name text,
    email text NOT NULL,
    phone text,
    company text,
    industry character varying(100),
    headcount character varying(50),
    message text,
    source_page character varying(255),
    utm_source character varying(100),
    utm_medium character varying(100),
    utm_campaign character varying(100),
    ip_address character varying(100),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: recruitai_leads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recruitai_leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recruitai_leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recruitai_leads_id_seq OWNED BY public.recruitai_leads.id;


--
-- Name: research_audience; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.research_audience (
    id integer NOT NULL,
    audience_id uuid DEFAULT gen_random_uuid(),
    brand_id uuid NOT NULL,
    positioning_statement text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: research_audience_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.research_audience_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: research_audience_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.research_audience_id_seq OWNED BY public.research_audience.id;


--
-- Name: research_audience_segments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.research_audience_segments (
    id integer NOT NULL,
    segment_id uuid DEFAULT gen_random_uuid(),
    audience_id uuid NOT NULL,
    name character varying(500) NOT NULL,
    demographics text,
    psychographics text,
    pain_points text,
    channels text,
    size character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: research_audience_segments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.research_audience_segments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: research_audience_segments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.research_audience_segments_id_seq OWNED BY public.research_audience_segments.id;


--
-- Name: research_business; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.research_business (
    id integer NOT NULL,
    research_id uuid DEFAULT gen_random_uuid(),
    brand_id uuid NOT NULL,
    business_overview text,
    mission_vision_values text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: research_business_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.research_business_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: research_business_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.research_business_id_seq OWNED BY public.research_business.id;


--
-- Name: research_competitors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.research_competitors (
    id integer NOT NULL,
    competitor_id uuid DEFAULT gen_random_uuid(),
    brand_id uuid NOT NULL,
    name character varying(500) NOT NULL,
    website character varying(500),
    strengths text,
    weaknesses text,
    social_presence text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: research_competitors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.research_competitors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: research_competitors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.research_competitors_id_seq OWNED BY public.research_competitors.id;


--
-- Name: research_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.research_products (
    id integer NOT NULL,
    product_id uuid DEFAULT gen_random_uuid(),
    brand_id uuid NOT NULL,
    name character varying(500) NOT NULL,
    category character varying(255),
    description text,
    key_features text,
    price_range character varying(255),
    target_segment character varying(500),
    usp text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: research_products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.research_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: research_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.research_products_id_seq OWNED BY public.research_products.id;


--
-- Name: sandbox_tests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sandbox_tests (
    id integer NOT NULL,
    test_id uuid DEFAULT gen_random_uuid(),
    agent_type character varying(50) NOT NULL,
    client_name character varying(255) NOT NULL,
    brief text NOT NULL,
    results jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: sandbox_tests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sandbox_tests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sandbox_tests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sandbox_tests_id_seq OWNED BY public.sandbox_tests.id;


--
-- Name: social_ad_campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_ad_campaigns (
    id integer NOT NULL,
    task_id character varying(255) NOT NULL,
    campaign_name character varying(500) NOT NULL,
    objective character varying(100),
    funnel_stage character varying(100),
    platform character varying(100),
    budget_hkd numeric(12,2),
    budget_pct numeric(5,2),
    audience_definition text,
    geo character varying(100),
    placements text,
    status character varying(50) DEFAULT 'Draft'::character varying,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: social_ad_campaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.social_ad_campaigns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: social_ad_campaigns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.social_ad_campaigns_id_seq OWNED BY public.social_ad_campaigns.id;


--
-- Name: social_artefacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_artefacts (
    id integer NOT NULL,
    task_id character varying(255) NOT NULL,
    artefact_key character varying(255) NOT NULL,
    artefact_type character varying(50),
    markdown_content text,
    json_structure jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: social_artefacts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.social_artefacts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: social_artefacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.social_artefacts_id_seq OWNED BY public.social_artefacts.id;


--
-- Name: social_calendar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_calendar (
    id integer NOT NULL,
    post_id uuid DEFAULT gen_random_uuid(),
    brand_id uuid NOT NULL,
    project_id uuid,
    date date NOT NULL,
    platform character varying(50),
    format character varying(50),
    pillar character varying(100),
    campaign character varying(255),
    title character varying(500),
    objective character varying(255),
    key_message text,
    visual_type character varying(100),
    caption_status character varying(50) DEFAULT 'Draft'::character varying,
    visual_status character varying(50) DEFAULT 'Draft'::character varying,
    boost_plan character varying(100),
    link text,
    notes text,
    status character varying(50) DEFAULT 'Draft'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: social_calendar_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.social_calendar_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: social_calendar_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.social_calendar_id_seq OWNED BY public.social_calendar.id;


--
-- Name: social_campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_campaigns (
    id integer NOT NULL,
    task_id character varying(255) NOT NULL,
    brand_id character varying(255),
    project_id character varying(255),
    brief_title character varying(500),
    status character varying(50) DEFAULT 'DRAFT'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: social_campaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.social_campaigns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: social_campaigns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.social_campaigns_id_seq OWNED BY public.social_campaigns.id;


--
-- Name: social_community_management; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_community_management (
    id integer NOT NULL,
    community_id uuid DEFAULT gen_random_uuid(),
    brand_id uuid NOT NULL,
    project_id uuid,
    platform character varying(100),
    content_guideline text,
    response_templates text,
    escalation_rules text,
    moderation_policies text,
    engagement_strategies text,
    faq_content text,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: social_community_management_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.social_community_management_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: social_community_management_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.social_community_management_id_seq OWNED BY public.social_community_management.id;


--
-- Name: social_content_drafts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_content_drafts (
    id integer NOT NULL,
    draft_id uuid DEFAULT gen_random_uuid(),
    task_id character varying(255) NOT NULL,
    post_id character varying(255),
    platform character varying(50),
    format character varying(50),
    title character varying(500),
    pillar character varying(100),
    objective character varying(255),
    key_message text,
    copy_hook text,
    cta text,
    language character varying(20),
    visual_type character varying(100),
    caption text,
    hashtags jsonb DEFAULT '[]'::jsonb,
    status character varying(50) DEFAULT 'draft'::character varying,
    synced_to_calendar boolean DEFAULT false,
    calendar_post_id integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: social_content_drafts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.social_content_drafts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: social_content_drafts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.social_content_drafts_id_seq OWNED BY public.social_content_drafts.id;


--
-- Name: social_content_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_content_posts (
    id integer NOT NULL,
    task_id character varying(255) NOT NULL,
    post_date date,
    platform character varying(50),
    format character varying(50),
    title character varying(500),
    pillar character varying(100),
    objective character varying(255),
    key_message text,
    copy_hook text,
    cta text,
    language character varying(20),
    visual_type character varying(100),
    status character varying(50) DEFAULT 'Draft'::character varying,
    ad_plan character varying(255),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: social_content_posts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.social_content_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: social_content_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.social_content_posts_id_seq OWNED BY public.social_content_posts.id;


--
-- Name: social_interactive_content; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_interactive_content (
    id integer NOT NULL,
    content_id uuid DEFAULT gen_random_uuid(),
    brand_id uuid NOT NULL,
    project_id uuid,
    title character varying(500) NOT NULL,
    content_type character varying(100),
    description text,
    platforms text,
    engagement_goal character varying(255),
    expected_metrics text,
    launch_date date,
    status character varying(50) DEFAULT 'draft'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: social_interactive_content_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.social_interactive_content_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: social_interactive_content_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.social_interactive_content_id_seq OWNED BY public.social_interactive_content.id;


--
-- Name: social_kpi_definitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_kpi_definitions (
    id integer NOT NULL,
    task_id character varying(255) NOT NULL,
    kpi_name character varying(255) NOT NULL,
    kpi_type character varying(50),
    definition text,
    formula text,
    data_source character varying(255),
    reporting_frequency character varying(50),
    funnel_stage character varying(100),
    platform character varying(100),
    target_value character varying(100),
    target_direction character varying(50),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: social_kpi_definitions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.social_kpi_definitions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: social_kpi_definitions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.social_kpi_definitions_id_seq OWNED BY public.social_kpi_definitions.id;


--
-- Name: social_monitoring; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_monitoring (
    id integer NOT NULL,
    monitor_id uuid DEFAULT gen_random_uuid(),
    brand_id uuid NOT NULL,
    project_id uuid,
    platform character varying(100),
    keyword character varying(500),
    sentiment_trend text,
    engagement_rate numeric(5,2),
    mention_count integer,
    top_mentions text,
    action_items text,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: social_monitoring_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.social_monitoring_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: social_monitoring_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.social_monitoring_id_seq OWNED BY public.social_monitoring.id;


--
-- Name: social_states; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_states (
    id integer NOT NULL,
    task_id character varying(255) NOT NULL,
    brand_id character varying(255),
    project_id character varying(255),
    state jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: social_states_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.social_states_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: social_states_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.social_states_id_seq OWNED BY public.social_states.id;


--
-- Name: social_strategy; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_strategy (
    id integer NOT NULL,
    strategy_id uuid DEFAULT gen_random_uuid(),
    brand_id uuid NOT NULL,
    project_id uuid,
    objectives text,
    target_audiences text,
    channel_mix text,
    content_pillars text,
    posting_cadence text,
    media_approach text,
    kpis text,
    assumptions text,
    risks text,
    status character varying(50) DEFAULT 'draft'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: social_strategy_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.social_strategy_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: social_strategy_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.social_strategy_id_seq OWNED BY public.social_strategy.id;


--
-- Name: social_trend_research; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_trend_research (
    id integer NOT NULL,
    trend_id uuid DEFAULT gen_random_uuid(),
    brand_id uuid NOT NULL,
    project_id uuid,
    trend_name character varying(500) NOT NULL,
    category character varying(100),
    description text,
    relevance_score integer,
    platforms text,
    content_ideas text,
    launch_ideas text,
    status character varying(50) DEFAULT 'research'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: social_trend_research_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.social_trend_research_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: social_trend_research_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.social_trend_research_id_seq OWNED BY public.social_trend_research.id;


--
-- Name: tender_agent_run_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tender_agent_run_logs (
    log_id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_name text NOT NULL,
    run_id text,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    status text DEFAULT 'success'::text,
    items_processed integer DEFAULT 0,
    items_failed integer DEFAULT 0,
    error_detail text,
    meta jsonb
);


--
-- Name: tender_calibration_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tender_calibration_reports (
    report_id uuid DEFAULT gen_random_uuid() NOT NULL,
    generated_at timestamp with time zone DEFAULT now() NOT NULL,
    summary text,
    accuracy_precision double precision,
    accuracy_recall double precision,
    accuracy_f1 double precision,
    recommendations jsonb,
    no_changes_needed boolean DEFAULT false,
    approved_at timestamp with time zone,
    approved_updates jsonb
);


--
-- Name: tender_daily_digests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tender_daily_digests (
    digest_id uuid DEFAULT gen_random_uuid() NOT NULL,
    digest_date date NOT NULL,
    tenders_surfaced uuid[] DEFAULT '{}'::uuid[],
    narrative_summary text,
    hk_top_count integer DEFAULT 0,
    sg_top_count integer DEFAULT 0,
    closing_soon_count integer DEFAULT 0,
    new_tenders_total integer DEFAULT 0,
    sources_active integer DEFAULT 0,
    sources_with_issues integer DEFAULT 0,
    source_issue_details jsonb,
    generated_at timestamp with time zone DEFAULT now() NOT NULL,
    email_sent_at timestamp with time zone
);


--
-- Name: tender_decisions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tender_decisions (
    decision_id uuid DEFAULT gen_random_uuid() NOT NULL,
    tender_id uuid NOT NULL,
    decision text DEFAULT 'track'::text NOT NULL,
    decided_by text DEFAULT 'founder'::text NOT NULL,
    decided_at timestamp with time zone DEFAULT now() NOT NULL,
    notes text,
    assigned_to text,
    pipeline_stage text,
    pipeline_entered_at timestamp with time zone
);


--
-- Name: tender_evaluations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tender_evaluations (
    eval_id uuid DEFAULT gen_random_uuid() NOT NULL,
    tender_id uuid NOT NULL,
    capability_fit_score double precision DEFAULT 0 NOT NULL,
    business_potential_score double precision DEFAULT 0 NOT NULL,
    overall_relevance_score double precision DEFAULT 0 NOT NULL,
    is_latest boolean DEFAULT false NOT NULL,
    label text DEFAULT 'Ignore'::text NOT NULL,
    rationale text DEFAULT ''::text NOT NULL,
    signals_used jsonb,
    scoring_weights jsonb,
    model_used text,
    evaluated_at timestamp with time zone DEFAULT now() NOT NULL,
    scoring_version text
);


--
-- Name: tender_source_registry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tender_source_registry (
    source_id text NOT NULL,
    name text NOT NULL,
    organisation text,
    owner_type text DEFAULT 'gov'::text NOT NULL,
    jurisdiction text NOT NULL,
    source_type text DEFAULT 'rss_xml'::text NOT NULL,
    access text DEFAULT 'public'::text NOT NULL,
    priority smallint DEFAULT 2 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    base_url text,
    feed_url text,
    discovery_hub_url text,
    ingest_method text,
    update_pattern text DEFAULT 'unknown'::text,
    update_times_hkt text[],
    field_map jsonb,
    parsing_notes text,
    scraping_config jsonb,
    category_tags_default text[] DEFAULT '{}'::text[] NOT NULL,
    legal_notes text,
    reliability_score double precision,
    tags text[] DEFAULT '{}'::text[],
    notes text,
    last_checked_at timestamp with time zone,
    last_status text,
    last_status_detail text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tender_source_registry_source_type_check CHECK ((source_type = ANY (ARRAY['rss_xml'::text, 'api_json'::text, 'api_xml'::text, 'csv_open_data'::text, 'html_list'::text, 'html_hub'::text, 'html_reference'::text])))
);


--
-- Name: tenders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenders (
    tender_id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_id text NOT NULL,
    source_references text[] DEFAULT '{}'::text[],
    raw_pointer uuid,
    jurisdiction text NOT NULL,
    owner_type text DEFAULT 'gov'::text NOT NULL,
    source_url text,
    mapping_version text,
    tender_ref text,
    title text NOT NULL,
    description_snippet text,
    agency text,
    category_tags text[] DEFAULT '{}'::text[],
    raw_category text,
    publish_date date,
    publish_date_estimated boolean DEFAULT false,
    closing_date date,
    status text DEFAULT 'open'::text NOT NULL,
    first_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    budget_min numeric(15,2),
    budget_max numeric(15,2),
    currency text,
    budget_source text DEFAULT 'unknown'::text,
    is_canonical boolean DEFAULT true NOT NULL,
    canonical_tender_id uuid,
    evaluation_status text DEFAULT 'pending'::text NOT NULL,
    label text DEFAULT 'unscored'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    title_embedding public.vector(1536)
);


--
-- Name: v_category_breakdown; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_category_breakdown AS
 SELECT category_id,
    category_name,
    count(*) AS receipt_count,
    sum(amount) AS total_amount,
    sum(deductible_amount) AS deductible_amount,
    sum(non_deductible_amount) AS non_deductible_amount,
    avg(categorization_confidence) AS avg_confidence,
    count(*) FILTER (WHERE (requires_review = true)) AS review_required_count
   FROM public.receipts r
  GROUP BY category_id, category_name
  ORDER BY (sum(amount)) DESC;


--
-- Name: v_compliance_issues; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_compliance_issues AS
 SELECT receipt_id,
    batch_id,
    receipt_date,
    vendor,
    amount,
    category_name,
    array_length(compliance_errors, 1) AS error_count,
    array_length(compliance_warnings, 1) AS warning_count,
    compliance_errors,
    compliance_warnings,
    requires_review,
    reviewed
   FROM public.receipts r
  WHERE ((array_length(compliance_errors, 1) > 0) OR (array_length(compliance_warnings, 1) > 0))
  ORDER BY (array_length(compliance_errors, 1)) DESC, (array_length(compliance_warnings, 1)) DESC;


--
-- Name: v_recent_batches; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_recent_batches AS
 SELECT rb.batch_id,
    rb.client_name,
    rb.status,
    rb.total_receipts,
    rb.processed_receipts,
    rb.failed_receipts,
    rb.total_amount,
    rb.deductible_amount,
    rb.non_deductible_amount,
    rb.period_start,
    rb.period_end,
    rb.created_at,
    rb.completed_at,
    count(r.receipt_id) FILTER (WHERE (r.requires_review = true)) AS review_count
   FROM (public.receipt_batches rb
     LEFT JOIN public.receipts r ON ((rb.batch_id = r.batch_id)))
  GROUP BY rb.batch_id, rb.client_name, rb.status, rb.total_receipts, rb.processed_receipts, rb.failed_receipts, rb.total_amount, rb.deductible_amount, rb.non_deductible_amount, rb.period_start, rb.period_end, rb.created_at, rb.completed_at
  ORDER BY rb.created_at DESC;


--
-- Name: ziwei_birth_charts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ziwei_birth_charts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255),
    name character varying(255),
    birth_info jsonb NOT NULL,
    gan_zhi jsonb NOT NULL,
    base_chart jsonb NOT NULL,
    xuan_patterns jsonb DEFAULT '{}'::jsonb,
    decade_luck jsonb DEFAULT '[]'::jsonb,
    annual_luck jsonb DEFAULT '[]'::jsonb,
    monthly_luck jsonb DEFAULT '[]'::jsonb,
    daily_luck jsonb DEFAULT '[]'::jsonb,
    interpretations jsonb DEFAULT '[]'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    enhanced_interpretations jsonb,
    llm_enhancements jsonb,
    conversation_count integer DEFAULT 0,
    last_chat_at timestamp without time zone
);


--
-- Name: ziwei_compatibility_analyses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ziwei_compatibility_analyses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chart1_id uuid NOT NULL,
    chart2_id uuid NOT NULL,
    relationship_type character varying(50),
    compatibility_score numeric(5,4),
    harmonious_elements jsonb,
    conflicting_elements jsonb,
    full_report text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: ziwei_conversation_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ziwei_conversation_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    role character varying(20),
    content text NOT NULL,
    tokens_used integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: ziwei_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ziwei_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chart_id uuid NOT NULL,
    user_id character varying(255),
    title character varying(255),
    summary text,
    message_count integer DEFAULT 0,
    last_message_at timestamp without time zone,
    system_prompt text,
    model_used character varying(50) DEFAULT 'deepseek-chat'::character varying,
    tokens_used integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: ziwei_enhanced_interpretations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ziwei_enhanced_interpretations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chart_id uuid NOT NULL,
    rule_interpretation_id uuid,
    llm_enhancement jsonb NOT NULL,
    confidence_boost numeric(5,4),
    synthesis_summary text,
    model_used character varying(50) DEFAULT 'deepseek-reasoner'::character varying,
    tokens_input integer,
    tokens_output integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: ziwei_insights; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ziwei_insights (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chart_id uuid NOT NULL,
    life_stage character varying(50),
    analysis_depth character varying(20),
    life_guidance text,
    decade_analysis jsonb,
    recommendations jsonb,
    warnings jsonb,
    model_used character varying(50) DEFAULT 'deepseek-reasoner'::character varying,
    tokens_used integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: ziwei_interpretation_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ziwei_interpretation_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    version integer DEFAULT 1,
    scope character varying(50) NOT NULL,
    condition jsonb NOT NULL,
    interpretation jsonb NOT NULL,
    dimension_tags jsonb DEFAULT '[]'::jsonb,
    school character varying(50) DEFAULT 'zhongzhou'::character varying,
    consensus_label character varying(20) DEFAULT 'consensus'::character varying,
    source_refs jsonb DEFAULT '[]'::jsonb,
    statistics jsonb DEFAULT '{"match_rate": 0.5, "sample_size": 0, "confidence_level": 0}'::jsonb,
    notes text,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: ziwei_palaces; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ziwei_palaces (
    id character varying(50) NOT NULL,
    number integer,
    chinese character varying(50),
    english character varying(100),
    meaning text,
    governs jsonb DEFAULT '[]'::jsonb,
    positive_indicators text,
    negative_indicators text
);


--
-- Name: ziwei_rule_evaluations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ziwei_rule_evaluations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chart_id uuid,
    total_rules integer DEFAULT 0,
    matched_rules integer DEFAULT 0,
    results jsonb DEFAULT '[]'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: ziwei_rule_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ziwei_rule_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chart_id uuid,
    rule_id uuid,
    user_rating integer,
    outcome_status character varying(50),
    accuracy_flag character varying(50),
    user_notes text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: ziwei_rule_statistics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ziwei_rule_statistics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rule_id uuid,
    sample_size integer DEFAULT 0,
    match_count integer DEFAULT 0,
    mismatch_count integer DEFAULT 0,
    match_rate numeric(5,4) DEFAULT 0.5,
    confidence_level numeric(5,4) DEFAULT 0,
    last_updated timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: ziwei_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ziwei_rules (
    id character varying(100) NOT NULL,
    name character varying(255),
    rule_type character varying(50),
    scope character varying(50),
    condition jsonb DEFAULT '{}'::jsonb,
    interpretation jsonb DEFAULT '{}'::jsonb,
    dimension_tags jsonb DEFAULT '[]'::jsonb,
    school character varying(50) DEFAULT 'zhongzhou'::character varying,
    consensus_label character varying(50) DEFAULT 'consensus'::character varying,
    source_refs jsonb DEFAULT '[]'::jsonb,
    statistics jsonb DEFAULT '{}'::jsonb,
    notes text,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: ziwei_stars; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ziwei_stars (
    id character varying(50) NOT NULL,
    number integer,
    chinese character varying(50),
    english character varying(100),
    star_type character varying(50),
    nature jsonb DEFAULT '[]'::jsonb,
    attributes jsonb DEFAULT '{}'::jsonb,
    meanings text,
    interpretation text
);


--
-- Name: analyses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyses ALTER COLUMN id SET DEFAULT nextval('public.analyses_id_seq'::regclass);


--
-- Name: brand_products_services id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_products_services ALTER COLUMN id SET DEFAULT nextval('public.brand_products_services_id_seq'::regclass);


--
-- Name: brands id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands ALTER COLUMN id SET DEFAULT nextval('public.brands_id_seq'::regclass);


--
-- Name: category_statistics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_statistics ALTER COLUMN id SET DEFAULT nextval('public.category_statistics_id_seq'::regclass);


--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: crm_gmail_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_gmail_tokens ALTER COLUMN id SET DEFAULT nextval('public.crm_gmail_tokens_id_seq'::regclass);


--
-- Name: duplicate_receipts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.duplicate_receipts ALTER COLUMN id SET DEFAULT nextval('public.duplicate_receipts_id_seq'::regclass);


--
-- Name: intelligence_edm_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intelligence_edm_history ALTER COLUMN id SET DEFAULT nextval('public.intelligence_edm_history_id_seq'::regclass);


--
-- Name: intelligence_news id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intelligence_news ALTER COLUMN id SET DEFAULT nextval('public.intelligence_news_id_seq'::regclass);


--
-- Name: intelligence_sources id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intelligence_sources ALTER COLUMN id SET DEFAULT nextval('public.intelligence_sources_id_seq'::regclass);


--
-- Name: intelligence_summaries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intelligence_summaries ALTER COLUMN id SET DEFAULT nextval('public.intelligence_summaries_id_seq'::regclass);


--
-- Name: intelligence_topics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intelligence_topics ALTER COLUMN id SET DEFAULT nextval('public.intelligence_topics_id_seq'::regclass);


--
-- Name: media_assets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_assets ALTER COLUMN id SET DEFAULT nextval('public.media_assets_id_seq'::regclass);


--
-- Name: media_projects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_projects ALTER COLUMN id SET DEFAULT nextval('public.media_projects_id_seq'::regclass);


--
-- Name: media_prompts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_prompts ALTER COLUMN id SET DEFAULT nextval('public.media_prompts_id_seq'::regclass);


--
-- Name: media_style_guides id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_style_guides ALTER COLUMN id SET DEFAULT nextval('public.media_style_guides_id_seq'::regclass);


--
-- Name: meta_page_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meta_page_tokens ALTER COLUMN id SET DEFAULT nextval('public.meta_page_tokens_id_seq'::regclass);


--
-- Name: photo_booth_analytics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_booth_analytics ALTER COLUMN id SET DEFAULT nextval('public.photo_booth_analytics_id_seq'::regclass);


--
-- Name: photo_booth_errors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_booth_errors ALTER COLUMN id SET DEFAULT nextval('public.photo_booth_errors_id_seq'::regclass);


--
-- Name: photo_booth_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_booth_events ALTER COLUMN id SET DEFAULT nextval('public.photo_booth_events_id_seq'::regclass);


--
-- Name: photo_booth_images id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_booth_images ALTER COLUMN id SET DEFAULT nextval('public.photo_booth_images_id_seq'::regclass);


--
-- Name: photo_booth_qr_codes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_booth_qr_codes ALTER COLUMN id SET DEFAULT nextval('public.photo_booth_qr_codes_id_seq'::regclass);


--
-- Name: photo_booth_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_booth_sessions ALTER COLUMN id SET DEFAULT nextval('public.photo_booth_sessions_id_seq'::regclass);


--
-- Name: photo_booth_themes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_booth_themes ALTER COLUMN id SET DEFAULT nextval('public.photo_booth_themes_id_seq'::regclass);


--
-- Name: pnl_learning_data id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pnl_learning_data ALTER COLUMN id SET DEFAULT nextval('public.pnl_learning_data_id_seq'::regclass);


--
-- Name: processing_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processing_logs ALTER COLUMN id SET DEFAULT nextval('public.processing_logs_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: radiance_enquiries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.radiance_enquiries ALTER COLUMN id SET DEFAULT nextval('public.radiance_enquiries_id_seq'::regclass);


--
-- Name: radiance_media id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.radiance_media ALTER COLUMN id SET DEFAULT nextval('public.radiance_media_id_seq'::regclass);


--
-- Name: receipt_batches id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipt_batches ALTER COLUMN id SET DEFAULT nextval('public.receipt_batches_id_seq'::regclass);


--
-- Name: receipts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipts ALTER COLUMN id SET DEFAULT nextval('public.receipts_id_seq'::regclass);


--
-- Name: recruitai_chat_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruitai_chat_messages ALTER COLUMN id SET DEFAULT nextval('public.recruitai_chat_messages_id_seq'::regclass);


--
-- Name: recruitai_chat_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruitai_chat_sessions ALTER COLUMN id SET DEFAULT nextval('public.recruitai_chat_sessions_id_seq'::regclass);


--
-- Name: recruitai_leads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruitai_leads ALTER COLUMN id SET DEFAULT nextval('public.recruitai_leads_id_seq'::regclass);


--
-- Name: research_audience id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_audience ALTER COLUMN id SET DEFAULT nextval('public.research_audience_id_seq'::regclass);


--
-- Name: research_audience_segments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_audience_segments ALTER COLUMN id SET DEFAULT nextval('public.research_audience_segments_id_seq'::regclass);


--
-- Name: research_business id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_business ALTER COLUMN id SET DEFAULT nextval('public.research_business_id_seq'::regclass);


--
-- Name: research_competitors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_competitors ALTER COLUMN id SET DEFAULT nextval('public.research_competitors_id_seq'::regclass);


--
-- Name: research_products id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_products ALTER COLUMN id SET DEFAULT nextval('public.research_products_id_seq'::regclass);


--
-- Name: sandbox_tests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sandbox_tests ALTER COLUMN id SET DEFAULT nextval('public.sandbox_tests_id_seq'::regclass);


--
-- Name: social_ad_campaigns id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_ad_campaigns ALTER COLUMN id SET DEFAULT nextval('public.social_ad_campaigns_id_seq'::regclass);


--
-- Name: social_artefacts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_artefacts ALTER COLUMN id SET DEFAULT nextval('public.social_artefacts_id_seq'::regclass);


--
-- Name: social_calendar id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_calendar ALTER COLUMN id SET DEFAULT nextval('public.social_calendar_id_seq'::regclass);


--
-- Name: social_campaigns id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_campaigns ALTER COLUMN id SET DEFAULT nextval('public.social_campaigns_id_seq'::regclass);


--
-- Name: social_community_management id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_community_management ALTER COLUMN id SET DEFAULT nextval('public.social_community_management_id_seq'::regclass);


--
-- Name: social_content_drafts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_content_drafts ALTER COLUMN id SET DEFAULT nextval('public.social_content_drafts_id_seq'::regclass);


--
-- Name: social_content_posts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_content_posts ALTER COLUMN id SET DEFAULT nextval('public.social_content_posts_id_seq'::regclass);


--
-- Name: social_interactive_content id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_interactive_content ALTER COLUMN id SET DEFAULT nextval('public.social_interactive_content_id_seq'::regclass);


--
-- Name: social_kpi_definitions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_kpi_definitions ALTER COLUMN id SET DEFAULT nextval('public.social_kpi_definitions_id_seq'::regclass);


--
-- Name: social_monitoring id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_monitoring ALTER COLUMN id SET DEFAULT nextval('public.social_monitoring_id_seq'::regclass);


--
-- Name: social_states id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_states ALTER COLUMN id SET DEFAULT nextval('public.social_states_id_seq'::regclass);


--
-- Name: social_strategy id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_strategy ALTER COLUMN id SET DEFAULT nextval('public.social_strategy_id_seq'::regclass);


--
-- Name: social_trend_research id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_trend_research ALTER COLUMN id SET DEFAULT nextval('public.social_trend_research_id_seq'::regclass);


--
-- Name: ads_adsets ads_adsets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads_adsets
    ADD CONSTRAINT ads_adsets_pkey PRIMARY KEY (id);


--
-- Name: ads_adsets ads_adsets_platform_tenant_id_adset_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads_adsets
    ADD CONSTRAINT ads_adsets_platform_tenant_id_adset_id_key UNIQUE (platform, tenant_id, adset_id);


--
-- Name: ads_campaigns ads_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads_campaigns
    ADD CONSTRAINT ads_campaigns_pkey PRIMARY KEY (id);


--
-- Name: ads_campaigns ads_campaigns_platform_tenant_id_campaign_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads_campaigns
    ADD CONSTRAINT ads_campaigns_platform_tenant_id_campaign_id_key UNIQUE (platform, tenant_id, campaign_id);


--
-- Name: ads_creatives ads_creatives_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads_creatives
    ADD CONSTRAINT ads_creatives_pkey PRIMARY KEY (id);


--
-- Name: ads_creatives ads_creatives_platform_tenant_id_ad_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads_creatives
    ADD CONSTRAINT ads_creatives_platform_tenant_id_ad_id_key UNIQUE (platform, tenant_id, ad_id);


--
-- Name: ads_daily_performance ads_daily_performance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads_daily_performance
    ADD CONSTRAINT ads_daily_performance_pkey PRIMARY KEY (id);


--
-- Name: analyses analyses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyses
    ADD CONSTRAINT analyses_pkey PRIMARY KEY (id);


--
-- Name: brand_products_services brand_products_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_products_services
    ADD CONSTRAINT brand_products_services_pkey PRIMARY KEY (id);


--
-- Name: brand_products_services brand_products_services_product_service_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_products_services
    ADD CONSTRAINT brand_products_services_product_service_id_key UNIQUE (product_service_id);


--
-- Name: brands brands_brand_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_brand_id_key UNIQUE (brand_id);


--
-- Name: brands brands_brand_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_brand_name_key UNIQUE (brand_name);


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- Name: category_statistics category_statistics_batch_id_category_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_statistics
    ADD CONSTRAINT category_statistics_batch_id_category_id_key UNIQUE (batch_id, category_id);


--
-- Name: category_statistics category_statistics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_statistics
    ADD CONSTRAINT category_statistics_pkey PRIMARY KEY (id);


--
-- Name: client_credentials client_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_credentials
    ADD CONSTRAINT client_credentials_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_conversation_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_conversation_id_key UNIQUE (conversation_id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: crm_clients crm_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_clients
    ADD CONSTRAINT crm_clients_pkey PRIMARY KEY (id);


--
-- Name: crm_contact_project_links crm_contact_project_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_contact_project_links
    ADD CONSTRAINT crm_contact_project_links_pkey PRIMARY KEY (id);


--
-- Name: crm_contacts crm_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_contacts
    ADD CONSTRAINT crm_contacts_pkey PRIMARY KEY (id);


--
-- Name: crm_feedback crm_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_feedback
    ADD CONSTRAINT crm_feedback_pkey PRIMARY KEY (id);


--
-- Name: crm_gmail_tokens crm_gmail_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_gmail_tokens
    ADD CONSTRAINT crm_gmail_tokens_pkey PRIMARY KEY (id);


--
-- Name: crm_projects crm_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_projects
    ADD CONSTRAINT crm_projects_pkey PRIMARY KEY (id);


--
-- Name: duplicate_receipts duplicate_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.duplicate_receipts
    ADD CONSTRAINT duplicate_receipts_pkey PRIMARY KEY (id);


--
-- Name: duplicate_receipts duplicate_receipts_receipt_id_1_receipt_id_2_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.duplicate_receipts
    ADD CONSTRAINT duplicate_receipts_receipt_id_1_receipt_id_2_key UNIQUE (receipt_id_1, receipt_id_2);


--
-- Name: growth_assets growth_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_assets
    ADD CONSTRAINT growth_assets_pkey PRIMARY KEY (id);


--
-- Name: growth_crm_flows growth_crm_flows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_crm_flows
    ADD CONSTRAINT growth_crm_flows_pkey PRIMARY KEY (id);


--
-- Name: growth_edm_campaigns growth_edm_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_edm_campaigns
    ADD CONSTRAINT growth_edm_campaigns_pkey PRIMARY KEY (id);


--
-- Name: growth_experiments growth_experiments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_experiments
    ADD CONSTRAINT growth_experiments_pkey PRIMARY KEY (id);


--
-- Name: growth_kb growth_kb_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_kb
    ADD CONSTRAINT growth_kb_pkey PRIMARY KEY (id);


--
-- Name: growth_metrics_snapshots growth_metrics_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_metrics_snapshots
    ADD CONSTRAINT growth_metrics_snapshots_pkey PRIMARY KEY (id);


--
-- Name: growth_plans growth_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_plans
    ADD CONSTRAINT growth_plans_pkey PRIMARY KEY (id);


--
-- Name: growth_roas_models growth_roas_models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_roas_models
    ADD CONSTRAINT growth_roas_models_pkey PRIMARY KEY (id);


--
-- Name: growth_weekly_reviews growth_weekly_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_weekly_reviews
    ADD CONSTRAINT growth_weekly_reviews_pkey PRIMARY KEY (id);


--
-- Name: intelligence_edm_history intelligence_edm_history_edm_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intelligence_edm_history
    ADD CONSTRAINT intelligence_edm_history_edm_id_key UNIQUE (edm_id);


--
-- Name: intelligence_edm_history intelligence_edm_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intelligence_edm_history
    ADD CONSTRAINT intelligence_edm_history_pkey PRIMARY KEY (id);


--
-- Name: intelligence_news intelligence_news_news_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intelligence_news
    ADD CONSTRAINT intelligence_news_news_id_key UNIQUE (news_id);


--
-- Name: intelligence_news intelligence_news_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intelligence_news
    ADD CONSTRAINT intelligence_news_pkey PRIMARY KEY (id);


--
-- Name: intelligence_sources intelligence_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intelligence_sources
    ADD CONSTRAINT intelligence_sources_pkey PRIMARY KEY (id);


--
-- Name: intelligence_sources intelligence_sources_source_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intelligence_sources
    ADD CONSTRAINT intelligence_sources_source_id_key UNIQUE (source_id);


--
-- Name: intelligence_summaries intelligence_summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intelligence_summaries
    ADD CONSTRAINT intelligence_summaries_pkey PRIMARY KEY (id);


--
-- Name: intelligence_summaries intelligence_summaries_summary_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intelligence_summaries
    ADD CONSTRAINT intelligence_summaries_summary_id_key UNIQUE (summary_id);


--
-- Name: intelligence_topics intelligence_topics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intelligence_topics
    ADD CONSTRAINT intelligence_topics_pkey PRIMARY KEY (id);


--
-- Name: intelligence_topics intelligence_topics_topic_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intelligence_topics
    ADD CONSTRAINT intelligence_topics_topic_id_key UNIQUE (topic_id);


--
-- Name: media_assets media_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_assets
    ADD CONSTRAINT media_assets_pkey PRIMARY KEY (id);


--
-- Name: media_projects media_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_projects
    ADD CONSTRAINT media_projects_pkey PRIMARY KEY (id);


--
-- Name: media_prompts media_prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_prompts
    ADD CONSTRAINT media_prompts_pkey PRIMARY KEY (id);


--
-- Name: media_style_guides media_style_guides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_style_guides
    ADD CONSTRAINT media_style_guides_pkey PRIMARY KEY (id);


--
-- Name: media_style_guides media_style_guides_project_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_style_guides
    ADD CONSTRAINT media_style_guides_project_id_key UNIQUE (project_id);


--
-- Name: meta_page_tokens meta_page_tokens_page_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meta_page_tokens
    ADD CONSTRAINT meta_page_tokens_page_id_key UNIQUE (page_id);


--
-- Name: meta_page_tokens meta_page_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meta_page_tokens
    ADD CONSTRAINT meta_page_tokens_pkey PRIMARY KEY (id);


--
-- Name: photo_booth_analytics photo_booth_analytics_event_id_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_booth_analytics
    ADD CONSTRAINT photo_booth_analytics_event_id_date_key UNIQUE (event_id, date);


--
-- Name: photo_booth_analytics photo_booth_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_booth_analytics
    ADD CONSTRAINT photo_booth_analytics_pkey PRIMARY KEY (id);


--
-- Name: photo_booth_errors photo_booth_errors_error_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_booth_errors
    ADD CONSTRAINT photo_booth_errors_error_id_key UNIQUE (error_id);


--
-- Name: photo_booth_errors photo_booth_errors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_booth_errors
    ADD CONSTRAINT photo_booth_errors_pkey PRIMARY KEY (id);


--
-- Name: photo_booth_events photo_booth_events_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_booth_events
    ADD CONSTRAINT photo_booth_events_event_id_key UNIQUE (event_id);


--
-- Name: photo_booth_events photo_booth_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_booth_events
    ADD CONSTRAINT photo_booth_events_pkey PRIMARY KEY (id);


--
-- Name: photo_booth_images photo_booth_images_image_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_booth_images
    ADD CONSTRAINT photo_booth_images_image_id_key UNIQUE (image_id);


--
-- Name: photo_booth_images photo_booth_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_booth_images
    ADD CONSTRAINT photo_booth_images_pkey PRIMARY KEY (id);


--
-- Name: photo_booth_qr_codes photo_booth_qr_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_booth_qr_codes
    ADD CONSTRAINT photo_booth_qr_codes_pkey PRIMARY KEY (id);


--
-- Name: photo_booth_qr_codes photo_booth_qr_codes_qr_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_booth_qr_codes
    ADD CONSTRAINT photo_booth_qr_codes_qr_id_key UNIQUE (qr_id);


--
-- Name: photo_booth_sessions photo_booth_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_booth_sessions
    ADD CONSTRAINT photo_booth_sessions_pkey PRIMARY KEY (id);


--
-- Name: photo_booth_sessions photo_booth_sessions_session_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_booth_sessions
    ADD CONSTRAINT photo_booth_sessions_session_id_key UNIQUE (session_id);


--
-- Name: photo_booth_themes photo_booth_themes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_booth_themes
    ADD CONSTRAINT photo_booth_themes_pkey PRIMARY KEY (id);


--
-- Name: photo_booth_themes photo_booth_themes_theme_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_booth_themes
    ADD CONSTRAINT photo_booth_themes_theme_id_key UNIQUE (theme_id);


--
-- Name: pnl_learning_data pnl_learning_data_learning_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pnl_learning_data
    ADD CONSTRAINT pnl_learning_data_learning_id_key UNIQUE (learning_id);


--
-- Name: pnl_learning_data pnl_learning_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pnl_learning_data
    ADD CONSTRAINT pnl_learning_data_pkey PRIMARY KEY (id);


--
-- Name: processing_logs processing_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processing_logs
    ADD CONSTRAINT processing_logs_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: projects projects_project_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_project_id_key UNIQUE (project_id);


--
-- Name: radiance_blog_cms radiance_blog_cms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.radiance_blog_cms
    ADD CONSTRAINT radiance_blog_cms_pkey PRIMARY KEY (slug);


--
-- Name: radiance_case_study_cms radiance_case_study_cms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.radiance_case_study_cms
    ADD CONSTRAINT radiance_case_study_cms_pkey PRIMARY KEY (slug);


--
-- Name: radiance_enquiries radiance_enquiries_enquiry_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.radiance_enquiries
    ADD CONSTRAINT radiance_enquiries_enquiry_id_key UNIQUE (enquiry_id);


--
-- Name: radiance_enquiries radiance_enquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.radiance_enquiries
    ADD CONSTRAINT radiance_enquiries_pkey PRIMARY KEY (id);


--
-- Name: radiance_media radiance_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.radiance_media
    ADD CONSTRAINT radiance_media_pkey PRIMARY KEY (id);


--
-- Name: raw_tender_captures raw_tender_captures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.raw_tender_captures
    ADD CONSTRAINT raw_tender_captures_pkey PRIMARY KEY (capture_id);


--
-- Name: receipt_batches receipt_batches_batch_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipt_batches
    ADD CONSTRAINT receipt_batches_batch_id_key UNIQUE (batch_id);


--
-- Name: receipt_batches receipt_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipt_batches
    ADD CONSTRAINT receipt_batches_pkey PRIMARY KEY (id);


--
-- Name: receipts receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_pkey PRIMARY KEY (id);


--
-- Name: receipts receipts_receipt_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_receipt_id_key UNIQUE (receipt_id);


--
-- Name: recruitai_chat_messages recruitai_chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruitai_chat_messages
    ADD CONSTRAINT recruitai_chat_messages_pkey PRIMARY KEY (id);


--
-- Name: recruitai_chat_sessions recruitai_chat_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruitai_chat_sessions
    ADD CONSTRAINT recruitai_chat_sessions_pkey PRIMARY KEY (id);


--
-- Name: recruitai_chat_sessions recruitai_chat_sessions_session_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruitai_chat_sessions
    ADD CONSTRAINT recruitai_chat_sessions_session_id_key UNIQUE (session_id);


--
-- Name: recruitai_leads recruitai_leads_lead_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruitai_leads
    ADD CONSTRAINT recruitai_leads_lead_id_key UNIQUE (lead_id);


--
-- Name: recruitai_leads recruitai_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruitai_leads
    ADD CONSTRAINT recruitai_leads_pkey PRIMARY KEY (id);


--
-- Name: research_audience research_audience_audience_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_audience
    ADD CONSTRAINT research_audience_audience_id_key UNIQUE (audience_id);


--
-- Name: research_audience research_audience_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_audience
    ADD CONSTRAINT research_audience_pkey PRIMARY KEY (id);


--
-- Name: research_audience_segments research_audience_segments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_audience_segments
    ADD CONSTRAINT research_audience_segments_pkey PRIMARY KEY (id);


--
-- Name: research_audience_segments research_audience_segments_segment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_audience_segments
    ADD CONSTRAINT research_audience_segments_segment_id_key UNIQUE (segment_id);


--
-- Name: research_business research_business_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_business
    ADD CONSTRAINT research_business_pkey PRIMARY KEY (id);


--
-- Name: research_business research_business_research_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_business
    ADD CONSTRAINT research_business_research_id_key UNIQUE (research_id);


--
-- Name: research_competitors research_competitors_competitor_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_competitors
    ADD CONSTRAINT research_competitors_competitor_id_key UNIQUE (competitor_id);


--
-- Name: research_competitors research_competitors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_competitors
    ADD CONSTRAINT research_competitors_pkey PRIMARY KEY (id);


--
-- Name: research_products research_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_products
    ADD CONSTRAINT research_products_pkey PRIMARY KEY (id);


--
-- Name: research_products research_products_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_products
    ADD CONSTRAINT research_products_product_id_key UNIQUE (product_id);


--
-- Name: sandbox_tests sandbox_tests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sandbox_tests
    ADD CONSTRAINT sandbox_tests_pkey PRIMARY KEY (id);


--
-- Name: sandbox_tests sandbox_tests_test_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sandbox_tests
    ADD CONSTRAINT sandbox_tests_test_id_key UNIQUE (test_id);


--
-- Name: social_ad_campaigns social_ad_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_ad_campaigns
    ADD CONSTRAINT social_ad_campaigns_pkey PRIMARY KEY (id);


--
-- Name: social_artefacts social_artefacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_artefacts
    ADD CONSTRAINT social_artefacts_pkey PRIMARY KEY (id);


--
-- Name: social_artefacts social_artefacts_task_id_artefact_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_artefacts
    ADD CONSTRAINT social_artefacts_task_id_artefact_key_key UNIQUE (task_id, artefact_key);


--
-- Name: social_calendar social_calendar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_calendar
    ADD CONSTRAINT social_calendar_pkey PRIMARY KEY (id);


--
-- Name: social_calendar social_calendar_post_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_calendar
    ADD CONSTRAINT social_calendar_post_id_key UNIQUE (post_id);


--
-- Name: social_campaigns social_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_campaigns
    ADD CONSTRAINT social_campaigns_pkey PRIMARY KEY (id);


--
-- Name: social_campaigns social_campaigns_task_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_campaigns
    ADD CONSTRAINT social_campaigns_task_id_key UNIQUE (task_id);


--
-- Name: social_community_management social_community_management_community_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_community_management
    ADD CONSTRAINT social_community_management_community_id_key UNIQUE (community_id);


--
-- Name: social_community_management social_community_management_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_community_management
    ADD CONSTRAINT social_community_management_pkey PRIMARY KEY (id);


--
-- Name: social_content_drafts social_content_drafts_draft_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_content_drafts
    ADD CONSTRAINT social_content_drafts_draft_id_key UNIQUE (draft_id);


--
-- Name: social_content_drafts social_content_drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_content_drafts
    ADD CONSTRAINT social_content_drafts_pkey PRIMARY KEY (id);


--
-- Name: social_content_posts social_content_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_content_posts
    ADD CONSTRAINT social_content_posts_pkey PRIMARY KEY (id);


--
-- Name: social_interactive_content social_interactive_content_content_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_interactive_content
    ADD CONSTRAINT social_interactive_content_content_id_key UNIQUE (content_id);


--
-- Name: social_interactive_content social_interactive_content_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_interactive_content
    ADD CONSTRAINT social_interactive_content_pkey PRIMARY KEY (id);


--
-- Name: social_kpi_definitions social_kpi_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_kpi_definitions
    ADD CONSTRAINT social_kpi_definitions_pkey PRIMARY KEY (id);


--
-- Name: social_monitoring social_monitoring_monitor_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_monitoring
    ADD CONSTRAINT social_monitoring_monitor_id_key UNIQUE (monitor_id);


--
-- Name: social_monitoring social_monitoring_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_monitoring
    ADD CONSTRAINT social_monitoring_pkey PRIMARY KEY (id);


--
-- Name: social_states social_states_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_states
    ADD CONSTRAINT social_states_pkey PRIMARY KEY (id);


--
-- Name: social_states social_states_task_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_states
    ADD CONSTRAINT social_states_task_id_key UNIQUE (task_id);


--
-- Name: social_strategy social_strategy_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_strategy
    ADD CONSTRAINT social_strategy_pkey PRIMARY KEY (id);


--
-- Name: social_strategy social_strategy_strategy_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_strategy
    ADD CONSTRAINT social_strategy_strategy_id_key UNIQUE (strategy_id);


--
-- Name: social_trend_research social_trend_research_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_trend_research
    ADD CONSTRAINT social_trend_research_pkey PRIMARY KEY (id);


--
-- Name: social_trend_research social_trend_research_trend_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_trend_research
    ADD CONSTRAINT social_trend_research_trend_id_key UNIQUE (trend_id);


--
-- Name: tender_agent_run_logs tender_agent_run_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tender_agent_run_logs
    ADD CONSTRAINT tender_agent_run_logs_pkey PRIMARY KEY (log_id);


--
-- Name: tender_calibration_reports tender_calibration_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tender_calibration_reports
    ADD CONSTRAINT tender_calibration_reports_pkey PRIMARY KEY (report_id);


--
-- Name: tender_daily_digests tender_daily_digests_digest_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tender_daily_digests
    ADD CONSTRAINT tender_daily_digests_digest_date_key UNIQUE (digest_date);


--
-- Name: tender_daily_digests tender_daily_digests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tender_daily_digests
    ADD CONSTRAINT tender_daily_digests_pkey PRIMARY KEY (digest_id);


--
-- Name: tender_decisions tender_decisions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tender_decisions
    ADD CONSTRAINT tender_decisions_pkey PRIMARY KEY (decision_id);


--
-- Name: tender_evaluations tender_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tender_evaluations
    ADD CONSTRAINT tender_evaluations_pkey PRIMARY KEY (eval_id);


--
-- Name: tender_source_registry tender_source_registry_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tender_source_registry
    ADD CONSTRAINT tender_source_registry_pkey PRIMARY KEY (source_id);


--
-- Name: tenders tenders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenders
    ADD CONSTRAINT tenders_pkey PRIMARY KEY (tender_id);


--
-- Name: ziwei_birth_charts ziwei_birth_charts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ziwei_birth_charts
    ADD CONSTRAINT ziwei_birth_charts_pkey PRIMARY KEY (id);


--
-- Name: ziwei_compatibility_analyses ziwei_compatibility_analyses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ziwei_compatibility_analyses
    ADD CONSTRAINT ziwei_compatibility_analyses_pkey PRIMARY KEY (id);


--
-- Name: ziwei_conversation_messages ziwei_conversation_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ziwei_conversation_messages
    ADD CONSTRAINT ziwei_conversation_messages_pkey PRIMARY KEY (id);


--
-- Name: ziwei_conversations ziwei_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ziwei_conversations
    ADD CONSTRAINT ziwei_conversations_pkey PRIMARY KEY (id);


--
-- Name: ziwei_enhanced_interpretations ziwei_enhanced_interpretations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ziwei_enhanced_interpretations
    ADD CONSTRAINT ziwei_enhanced_interpretations_pkey PRIMARY KEY (id);


--
-- Name: ziwei_insights ziwei_insights_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ziwei_insights
    ADD CONSTRAINT ziwei_insights_pkey PRIMARY KEY (id);


--
-- Name: ziwei_interpretation_rules ziwei_interpretation_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ziwei_interpretation_rules
    ADD CONSTRAINT ziwei_interpretation_rules_pkey PRIMARY KEY (id);


--
-- Name: ziwei_palaces ziwei_palaces_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ziwei_palaces
    ADD CONSTRAINT ziwei_palaces_pkey PRIMARY KEY (id);


--
-- Name: ziwei_rule_evaluations ziwei_rule_evaluations_chart_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ziwei_rule_evaluations
    ADD CONSTRAINT ziwei_rule_evaluations_chart_id_key UNIQUE (chart_id);


--
-- Name: ziwei_rule_evaluations ziwei_rule_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ziwei_rule_evaluations
    ADD CONSTRAINT ziwei_rule_evaluations_pkey PRIMARY KEY (id);


--
-- Name: ziwei_rule_feedback ziwei_rule_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ziwei_rule_feedback
    ADD CONSTRAINT ziwei_rule_feedback_pkey PRIMARY KEY (id);


--
-- Name: ziwei_rule_statistics ziwei_rule_statistics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ziwei_rule_statistics
    ADD CONSTRAINT ziwei_rule_statistics_pkey PRIMARY KEY (id);


--
-- Name: ziwei_rule_statistics ziwei_rule_statistics_rule_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ziwei_rule_statistics
    ADD CONSTRAINT ziwei_rule_statistics_rule_id_key UNIQUE (rule_id);


--
-- Name: ziwei_rules ziwei_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ziwei_rules
    ADD CONSTRAINT ziwei_rules_pkey PRIMARY KEY (id);


--
-- Name: ziwei_stars ziwei_stars_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ziwei_stars
    ADD CONSTRAINT ziwei_stars_pkey PRIMARY KEY (id);


--
-- Name: idx_ads_adsets_campaign; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_adsets_campaign ON public.ads_adsets USING btree (tenant_id, campaign_id);


--
-- Name: idx_ads_adsets_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_adsets_tenant ON public.ads_adsets USING btree (tenant_id);


--
-- Name: idx_ads_campaigns_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_campaigns_tenant ON public.ads_campaigns USING btree (tenant_id);


--
-- Name: idx_ads_creatives_campaign; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_creatives_campaign ON public.ads_creatives USING btree (tenant_id, campaign_id);


--
-- Name: idx_ads_creatives_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_creatives_tenant ON public.ads_creatives USING btree (tenant_id);


--
-- Name: idx_ads_daily_perf_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_ads_daily_perf_unique ON public.ads_daily_performance USING btree (platform, tenant_id, campaign_id, ad_id, date);


--
-- Name: idx_ads_daily_performance_campaign; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_daily_performance_campaign ON public.ads_daily_performance USING btree (platform, campaign_id, date);


--
-- Name: idx_ads_daily_performance_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_daily_performance_date ON public.ads_daily_performance USING btree (date);


--
-- Name: idx_ads_daily_performance_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_daily_performance_tenant ON public.ads_daily_performance USING btree (tenant_id, date);


--
-- Name: idx_analysis_agent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_agent ON public.analyses USING btree (agent_type);


--
-- Name: idx_analysis_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_project ON public.analyses USING btree (project_id);


--
-- Name: idx_audience_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audience_brand ON public.research_audience USING btree (brand_id);


--
-- Name: idx_brands_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brands_name ON public.brands USING btree (brand_name);


--
-- Name: idx_brands_normalized; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brands_normalized ON public.brands USING btree (normalized_name);


--
-- Name: idx_brands_updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brands_updated ON public.brands USING btree (updated_at DESC);


--
-- Name: idx_calendar_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calendar_brand ON public.social_calendar USING btree (brand_id);


--
-- Name: idx_calendar_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calendar_date ON public.social_calendar USING btree (date);


--
-- Name: idx_category_stats_batch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_category_stats_batch ON public.category_statistics USING btree (batch_id);


--
-- Name: idx_category_stats_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_category_stats_category ON public.category_statistics USING btree (category_id);


--
-- Name: idx_client_credentials_tenant_service; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_credentials_tenant_service ON public.client_credentials USING btree (tenant_id, service);


--
-- Name: idx_community_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_community_brand ON public.social_community_management USING btree (brand_id);


--
-- Name: idx_competitors_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_competitors_brand ON public.research_competitors USING btree (brand_id);


--
-- Name: idx_conversations_agent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_agent ON public.conversations USING btree (agent_type);


--
-- Name: idx_conversations_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_brand ON public.conversations USING btree (brand_name);


--
-- Name: idx_conversations_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_created ON public.conversations USING btree (created_at DESC);


--
-- Name: idx_crm_clients_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_clients_name ON public.crm_clients USING btree (name);


--
-- Name: idx_crm_clients_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_clients_status ON public.crm_clients USING btree (status);


--
-- Name: idx_crm_contact_project_links_contact; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_contact_project_links_contact ON public.crm_contact_project_links USING btree (contact_id);


--
-- Name: idx_crm_contact_project_links_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_contact_project_links_project ON public.crm_contact_project_links USING btree (project_id);


--
-- Name: idx_crm_contacts_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_contacts_client ON public.crm_contacts USING btree (client_id);


--
-- Name: idx_crm_contacts_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_contacts_email ON public.crm_contacts USING btree (email);


--
-- Name: idx_crm_contacts_linkedin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_contacts_linkedin ON public.crm_contacts USING btree (linkedin_url);


--
-- Name: idx_crm_feedback_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_feedback_client ON public.crm_feedback USING btree (client_id);


--
-- Name: idx_crm_feedback_sentiment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_feedback_sentiment ON public.crm_feedback USING btree (sentiment);


--
-- Name: idx_crm_projects_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_projects_client ON public.crm_projects USING btree (client_id);


--
-- Name: idx_crm_projects_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_projects_status ON public.crm_projects USING btree (status);


--
-- Name: idx_duplicate_receipts_unresolved; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_duplicate_receipts_unresolved ON public.duplicate_receipts USING btree (resolved) WHERE (resolved = false);


--
-- Name: idx_edm_sent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_edm_sent ON public.intelligence_edm_history USING btree (sent_at DESC);


--
-- Name: idx_edm_topic; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_edm_topic ON public.intelligence_edm_history USING btree (topic_id);


--
-- Name: idx_growth_assets_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_growth_assets_brand ON public.growth_assets USING btree (brand_name);


--
-- Name: idx_growth_assets_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_growth_assets_plan ON public.growth_assets USING btree (plan_id);


--
-- Name: idx_growth_assets_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_growth_assets_status ON public.growth_assets USING btree (status);


--
-- Name: idx_growth_assets_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_growth_assets_type ON public.growth_assets USING btree (asset_type);


--
-- Name: idx_growth_crm_flows_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_growth_crm_flows_brand ON public.growth_crm_flows USING btree (brand_name);


--
-- Name: idx_growth_crm_flows_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_growth_crm_flows_status ON public.growth_crm_flows USING btree (status);


--
-- Name: idx_growth_edm_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_growth_edm_brand ON public.growth_edm_campaigns USING btree (brand_name);


--
-- Name: idx_growth_edm_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_growth_edm_status ON public.growth_edm_campaigns USING btree (status);


--
-- Name: idx_growth_experiments_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_growth_experiments_brand ON public.growth_experiments USING btree (brand_name);


--
-- Name: idx_growth_experiments_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_growth_experiments_plan ON public.growth_experiments USING btree (plan_id);


--
-- Name: idx_growth_experiments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_growth_experiments_status ON public.growth_experiments USING btree (status);


--
-- Name: idx_growth_kb_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_growth_kb_brand ON public.growth_kb USING btree (brand_name);


--
-- Name: idx_growth_kb_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_growth_kb_category ON public.growth_kb USING btree (category);


--
-- Name: idx_growth_kb_embedding; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_growth_kb_embedding ON public.growth_kb USING ivfflat (embedding public.vector_cosine_ops) WITH (lists='100');


--
-- Name: idx_growth_metrics_brand_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_growth_metrics_brand_date ON public.growth_metrics_snapshots USING btree (brand_name, snapshot_date);


--
-- Name: idx_growth_metrics_channel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_growth_metrics_channel ON public.growth_metrics_snapshots USING btree (channel);


--
-- Name: idx_growth_plans_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_growth_plans_brand ON public.growth_plans USING btree (brand_name);


--
-- Name: idx_growth_plans_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_growth_plans_created ON public.growth_plans USING btree (created_at DESC);


--
-- Name: idx_growth_plans_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_growth_plans_status ON public.growth_plans USING btree (status);


--
-- Name: idx_growth_reviews_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_growth_reviews_brand ON public.growth_weekly_reviews USING btree (brand_name);


--
-- Name: idx_growth_reviews_week; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_growth_reviews_week ON public.growth_weekly_reviews USING btree (week_start);


--
-- Name: idx_growth_roas_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_growth_roas_brand ON public.growth_roas_models USING btree (brand_name);


--
-- Name: idx_growth_roas_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_growth_roas_plan ON public.growth_roas_models USING btree (plan_id);


--
-- Name: idx_growth_roas_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_growth_roas_status ON public.growth_roas_models USING btree (status);


--
-- Name: idx_interactive_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interactive_brand ON public.social_interactive_content USING btree (brand_id);


--
-- Name: idx_monitoring_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_monitoring_brand ON public.social_monitoring USING btree (brand_id);


--
-- Name: idx_news_scraped; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_news_scraped ON public.intelligence_news USING btree (scraped_at DESC);


--
-- Name: idx_news_topic; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_news_topic ON public.intelligence_news USING btree (topic_id);


--
-- Name: idx_pb_images_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pb_images_session ON public.photo_booth_images USING btree (session_id);


--
-- Name: idx_pb_qr_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pb_qr_session ON public.photo_booth_qr_codes USING btree (session_id);


--
-- Name: idx_pb_sessions_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pb_sessions_event ON public.photo_booth_sessions USING btree (event_id);


--
-- Name: idx_pb_sessions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pb_sessions_status ON public.photo_booth_sessions USING btree (status);


--
-- Name: idx_pb_themes_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pb_themes_enabled ON public.photo_booth_themes USING btree (is_enabled);


--
-- Name: idx_pnl_learning_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pnl_learning_category ON public.pnl_learning_data USING btree (category_id);


--
-- Name: idx_pnl_learning_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pnl_learning_client ON public.pnl_learning_data USING btree (client_name);


--
-- Name: idx_processing_logs_batch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processing_logs_batch ON public.processing_logs USING btree (batch_id);


--
-- Name: idx_processing_logs_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processing_logs_created ON public.processing_logs USING btree (created_at DESC);


--
-- Name: idx_processing_logs_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processing_logs_level ON public.processing_logs USING btree (log_level);


--
-- Name: idx_processing_logs_receipt; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processing_logs_receipt ON public.processing_logs USING btree (receipt_id);


--
-- Name: idx_products_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_brand ON public.brand_products_services USING btree (brand_id);


--
-- Name: idx_products_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_created ON public.brand_products_services USING btree (created_at DESC);


--
-- Name: idx_products_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_status ON public.brand_products_services USING btree (status);


--
-- Name: idx_products_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_type ON public.brand_products_services USING btree (type);


--
-- Name: idx_project_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_client ON public.projects USING btree (client_name);


--
-- Name: idx_receipt_batches_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_receipt_batches_client ON public.receipt_batches USING btree (client_name);


--
-- Name: idx_receipt_batches_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_receipt_batches_created ON public.receipt_batches USING btree (created_at DESC);


--
-- Name: idx_receipt_batches_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_receipt_batches_status ON public.receipt_batches USING btree (status);


--
-- Name: idx_receipts_batch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_receipts_batch ON public.receipts USING btree (batch_id);


--
-- Name: idx_receipts_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_receipts_category ON public.receipts USING btree (category_id);


--
-- Name: idx_receipts_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_receipts_date ON public.receipts USING btree (receipt_date DESC);


--
-- Name: idx_receipts_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_receipts_hash ON public.receipts USING btree (image_hash);


--
-- Name: idx_receipts_review; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_receipts_review ON public.receipts USING btree (requires_review) WHERE (requires_review = true);


--
-- Name: idx_receipts_vendor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_receipts_vendor ON public.receipts USING btree (vendor);


--
-- Name: idx_recruitai_leads_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recruitai_leads_created ON public.recruitai_leads USING btree (created_at DESC);


--
-- Name: idx_recruitai_leads_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recruitai_leads_email ON public.recruitai_leads USING btree (email);


--
-- Name: idx_recruitai_leads_industry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recruitai_leads_industry ON public.recruitai_leads USING btree (industry);


--
-- Name: idx_recruitai_messages_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recruitai_messages_session ON public.recruitai_chat_messages USING btree (session_id);


--
-- Name: idx_recruitai_sessions_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recruitai_sessions_created ON public.recruitai_chat_sessions USING btree (created_at DESC);


--
-- Name: idx_recruitai_sessions_visitor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recruitai_sessions_visitor ON public.recruitai_chat_sessions USING btree (visitor_id);


--
-- Name: idx_research_business_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_research_business_brand ON public.research_business USING btree (brand_id);


--
-- Name: idx_research_products_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_research_products_brand ON public.research_products USING btree (brand_id);


--
-- Name: idx_rtc_captured_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rtc_captured_at ON public.raw_tender_captures USING btree (captured_at DESC);


--
-- Name: idx_rtc_normalised; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rtc_normalised ON public.raw_tender_captures USING btree (normalised) WHERE (normalised = false);


--
-- Name: idx_rtc_source_guid; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_rtc_source_guid ON public.raw_tender_captures USING btree (source_id, item_guid) WHERE (item_guid IS NOT NULL);


--
-- Name: idx_sandbox_agent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sandbox_agent ON public.sandbox_tests USING btree (agent_type);


--
-- Name: idx_sandbox_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sandbox_created ON public.sandbox_tests USING btree (created_at DESC);


--
-- Name: idx_segments_audience; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_segments_audience ON public.research_audience_segments USING btree (audience_id);


--
-- Name: idx_social_ads_platform; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_ads_platform ON public.social_ad_campaigns USING btree (platform);


--
-- Name: idx_social_ads_task; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_ads_task ON public.social_ad_campaigns USING btree (task_id);


--
-- Name: idx_social_artefacts_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_artefacts_key ON public.social_artefacts USING btree (artefact_key);


--
-- Name: idx_social_artefacts_task; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_artefacts_task ON public.social_artefacts USING btree (task_id);


--
-- Name: idx_social_campaigns_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_campaigns_brand ON public.social_campaigns USING btree (brand_id);


--
-- Name: idx_social_campaigns_task; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_campaigns_task ON public.social_campaigns USING btree (task_id);


--
-- Name: idx_social_drafts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_drafts_status ON public.social_content_drafts USING btree (status);


--
-- Name: idx_social_drafts_synced; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_drafts_synced ON public.social_content_drafts USING btree (synced_to_calendar);


--
-- Name: idx_social_drafts_task; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_drafts_task ON public.social_content_drafts USING btree (task_id);


--
-- Name: idx_social_kpis_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_kpis_name ON public.social_kpi_definitions USING btree (kpi_name);


--
-- Name: idx_social_kpis_task; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_kpis_task ON public.social_kpi_definitions USING btree (task_id);


--
-- Name: idx_social_posts_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_posts_date ON public.social_content_posts USING btree (post_date);


--
-- Name: idx_social_posts_platform; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_posts_platform ON public.social_content_posts USING btree (platform);


--
-- Name: idx_social_posts_task; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_posts_task ON public.social_content_posts USING btree (task_id);


--
-- Name: idx_social_states_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_states_brand ON public.social_states USING btree (brand_id);


--
-- Name: idx_social_states_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_states_project ON public.social_states USING btree (project_id);


--
-- Name: idx_social_states_task; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_states_task ON public.social_states USING btree (task_id);


--
-- Name: idx_sources_topic; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sources_topic ON public.intelligence_sources USING btree (topic_id);


--
-- Name: idx_strategy_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_strategy_brand ON public.social_strategy USING btree (brand_id);


--
-- Name: idx_strategy_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_strategy_project ON public.social_strategy USING btree (project_id);


--
-- Name: idx_summaries_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_summaries_created ON public.intelligence_summaries USING btree (created_at DESC);


--
-- Name: idx_summaries_topic; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_summaries_topic ON public.intelligence_summaries USING btree (topic_id);


--
-- Name: idx_tarl_agent_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tarl_agent_name ON public.tender_agent_run_logs USING btree (agent_name);


--
-- Name: idx_tarl_started_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tarl_started_at ON public.tender_agent_run_logs USING btree (started_at DESC);


--
-- Name: idx_td_decided_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_td_decided_at ON public.tender_decisions USING btree (decided_at DESC);


--
-- Name: idx_td_decision; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_td_decision ON public.tender_decisions USING btree (decision);


--
-- Name: idx_td_tender_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_td_tender_id ON public.tender_decisions USING btree (tender_id);


--
-- Name: idx_te_evaluated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_te_evaluated_at ON public.tender_evaluations USING btree (evaluated_at DESC);


--
-- Name: idx_te_label; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_te_label ON public.tender_evaluations USING btree (label);


--
-- Name: idx_te_tender_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_te_tender_id ON public.tender_evaluations USING btree (tender_id);


--
-- Name: idx_te_tender_latest; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_te_tender_latest ON public.tender_evaluations USING btree (tender_id) WHERE (is_latest = true);


--
-- Name: idx_tenders_category_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tenders_category_tags ON public.tenders USING gin (category_tags);


--
-- Name: idx_tenders_closing_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tenders_closing_date ON public.tenders USING btree (closing_date) WHERE (status = 'open'::text);


--
-- Name: idx_tenders_embedding; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tenders_embedding ON public.tenders USING ivfflat (title_embedding public.vector_cosine_ops) WITH (lists='50');


--
-- Name: idx_tenders_evaluation_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tenders_evaluation_status ON public.tenders USING btree (evaluation_status);


--
-- Name: idx_tenders_jurisdiction; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tenders_jurisdiction ON public.tenders USING btree (jurisdiction);


--
-- Name: idx_tenders_label; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tenders_label ON public.tenders USING btree (label);


--
-- Name: idx_tenders_ref_jurisdiction; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_tenders_ref_jurisdiction ON public.tenders USING btree (tender_ref, jurisdiction) WHERE ((tender_ref IS NOT NULL) AND (is_canonical = true));


--
-- Name: idx_topics_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_topics_status ON public.intelligence_topics USING btree (status);


--
-- Name: idx_trend_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trend_brand ON public.social_trend_research USING btree (brand_id);


--
-- Name: idx_tsr_jurisdiction; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tsr_jurisdiction ON public.tender_source_registry USING btree (jurisdiction);


--
-- Name: idx_tsr_source_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tsr_source_type ON public.tender_source_registry USING btree (source_type);


--
-- Name: idx_tsr_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tsr_status ON public.tender_source_registry USING btree (status);


--
-- Name: idx_ziwei_charts_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ziwei_charts_created ON public.ziwei_birth_charts USING btree (created_at DESC);


--
-- Name: idx_ziwei_charts_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ziwei_charts_user ON public.ziwei_birth_charts USING btree (user_id);


--
-- Name: idx_ziwei_compat_chart1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ziwei_compat_chart1 ON public.ziwei_compatibility_analyses USING btree (chart1_id);


--
-- Name: idx_ziwei_compat_chart2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ziwei_compat_chart2 ON public.ziwei_compatibility_analyses USING btree (chart2_id);


--
-- Name: idx_ziwei_conv_chart; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ziwei_conv_chart ON public.ziwei_conversations USING btree (chart_id);


--
-- Name: idx_ziwei_conv_updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ziwei_conv_updated ON public.ziwei_conversations USING btree (updated_at DESC);


--
-- Name: idx_ziwei_conv_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ziwei_conv_user ON public.ziwei_conversations USING btree (user_id);


--
-- Name: idx_ziwei_enhanced_chart; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ziwei_enhanced_chart ON public.ziwei_enhanced_interpretations USING btree (chart_id);


--
-- Name: idx_ziwei_evals_chart; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ziwei_evals_chart ON public.ziwei_rule_evaluations USING btree (chart_id);


--
-- Name: idx_ziwei_feedback_chart; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ziwei_feedback_chart ON public.ziwei_rule_feedback USING btree (chart_id);


--
-- Name: idx_ziwei_feedback_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ziwei_feedback_created ON public.ziwei_rule_feedback USING btree (created_at DESC);


--
-- Name: idx_ziwei_feedback_rule; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ziwei_feedback_rule ON public.ziwei_rule_feedback USING btree (rule_id);


--
-- Name: idx_ziwei_insights_chart; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ziwei_insights_chart ON public.ziwei_insights USING btree (chart_id);


--
-- Name: idx_ziwei_msg_conv; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ziwei_msg_conv ON public.ziwei_conversation_messages USING btree (conversation_id);


--
-- Name: idx_ziwei_msg_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ziwei_msg_created ON public.ziwei_conversation_messages USING btree (created_at);


--
-- Name: idx_ziwei_palaces_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ziwei_palaces_number ON public.ziwei_palaces USING btree (number);


--
-- Name: idx_ziwei_rules_consensus; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ziwei_rules_consensus ON public.ziwei_interpretation_rules USING btree (consensus_label);


--
-- Name: idx_ziwei_rules_school; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ziwei_rules_school ON public.ziwei_interpretation_rules USING btree (school);


--
-- Name: idx_ziwei_rules_scope; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ziwei_rules_scope ON public.ziwei_interpretation_rules USING btree (scope);


--
-- Name: idx_ziwei_rules_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ziwei_rules_status ON public.ziwei_interpretation_rules USING btree (status);


--
-- Name: idx_ziwei_rules_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ziwei_rules_type ON public.ziwei_rules USING btree (rule_type);


--
-- Name: idx_ziwei_stars_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ziwei_stars_type ON public.ziwei_stars USING btree (star_type);


--
-- Name: idx_ziwei_stats_match_rate; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ziwei_stats_match_rate ON public.ziwei_rule_statistics USING btree (match_rate DESC);


--
-- Name: pnl_learning_embedding_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pnl_learning_embedding_idx ON public.pnl_learning_data USING ivfflat (embedding public.vector_cosine_ops) WITH (lists='100');


--
-- Name: receipts trigger_update_batch_statistics; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_batch_statistics AFTER INSERT OR UPDATE ON public.receipts FOR EACH ROW EXECUTE FUNCTION public.update_batch_statistics();


--
-- Name: analyses analyses_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyses
    ADD CONSTRAINT analyses_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;


--
-- Name: category_statistics category_statistics_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_statistics
    ADD CONSTRAINT category_statistics_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.receipt_batches(batch_id) ON DELETE CASCADE;


--
-- Name: crm_contact_project_links crm_contact_project_links_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_contact_project_links
    ADD CONSTRAINT crm_contact_project_links_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.crm_contacts(id) ON DELETE CASCADE;


--
-- Name: crm_contact_project_links crm_contact_project_links_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_contact_project_links
    ADD CONSTRAINT crm_contact_project_links_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.crm_projects(id) ON DELETE CASCADE;


--
-- Name: crm_contacts crm_contacts_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_contacts
    ADD CONSTRAINT crm_contacts_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.crm_clients(id) ON DELETE CASCADE;


--
-- Name: crm_feedback crm_feedback_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_feedback
    ADD CONSTRAINT crm_feedback_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.crm_clients(id) ON DELETE CASCADE;


--
-- Name: crm_feedback crm_feedback_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_feedback
    ADD CONSTRAINT crm_feedback_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.crm_projects(id) ON DELETE SET NULL;


--
-- Name: crm_projects crm_projects_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_projects
    ADD CONSTRAINT crm_projects_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.crm_clients(id) ON DELETE CASCADE;


--
-- Name: duplicate_receipts duplicate_receipts_receipt_id_1_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.duplicate_receipts
    ADD CONSTRAINT duplicate_receipts_receipt_id_1_fkey FOREIGN KEY (receipt_id_1) REFERENCES public.receipts(receipt_id) ON DELETE CASCADE;


--
-- Name: duplicate_receipts duplicate_receipts_receipt_id_2_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.duplicate_receipts
    ADD CONSTRAINT duplicate_receipts_receipt_id_2_fkey FOREIGN KEY (receipt_id_2) REFERENCES public.receipts(receipt_id) ON DELETE CASCADE;


--
-- Name: research_audience_segments fk_audience_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_audience_segments
    ADD CONSTRAINT fk_audience_id FOREIGN KEY (audience_id) REFERENCES public.research_audience(audience_id) ON DELETE CASCADE;


--
-- Name: brand_products_services fk_brand_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_products_services
    ADD CONSTRAINT fk_brand_id FOREIGN KEY (brand_id) REFERENCES public.brands(brand_id) ON DELETE CASCADE;


--
-- Name: research_audience fk_brand_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_audience
    ADD CONSTRAINT fk_brand_id FOREIGN KEY (brand_id) REFERENCES public.brands(brand_id) ON DELETE CASCADE;


--
-- Name: research_business fk_brand_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_business
    ADD CONSTRAINT fk_brand_id FOREIGN KEY (brand_id) REFERENCES public.brands(brand_id) ON DELETE CASCADE;


--
-- Name: research_competitors fk_brand_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_competitors
    ADD CONSTRAINT fk_brand_id FOREIGN KEY (brand_id) REFERENCES public.brands(brand_id) ON DELETE CASCADE;


--
-- Name: research_products fk_brand_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_products
    ADD CONSTRAINT fk_brand_id FOREIGN KEY (brand_id) REFERENCES public.brands(brand_id) ON DELETE CASCADE;


--
-- Name: social_calendar fk_brand_id_calendar; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_calendar
    ADD CONSTRAINT fk_brand_id_calendar FOREIGN KEY (brand_id) REFERENCES public.brands(brand_id) ON DELETE CASCADE;


--
-- Name: social_community_management fk_brand_id_community; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_community_management
    ADD CONSTRAINT fk_brand_id_community FOREIGN KEY (brand_id) REFERENCES public.brands(brand_id) ON DELETE CASCADE;


--
-- Name: social_interactive_content fk_brand_id_interactive; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_interactive_content
    ADD CONSTRAINT fk_brand_id_interactive FOREIGN KEY (brand_id) REFERENCES public.brands(brand_id) ON DELETE CASCADE;


--
-- Name: social_monitoring fk_brand_id_monitoring; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_monitoring
    ADD CONSTRAINT fk_brand_id_monitoring FOREIGN KEY (brand_id) REFERENCES public.brands(brand_id) ON DELETE CASCADE;


--
-- Name: social_strategy fk_brand_id_strategy; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_strategy
    ADD CONSTRAINT fk_brand_id_strategy FOREIGN KEY (brand_id) REFERENCES public.brands(brand_id) ON DELETE CASCADE;


--
-- Name: social_trend_research fk_brand_id_trend; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_trend_research
    ADD CONSTRAINT fk_brand_id_trend FOREIGN KEY (brand_id) REFERENCES public.brands(brand_id) ON DELETE CASCADE;


--
-- Name: growth_assets growth_assets_experiment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_assets
    ADD CONSTRAINT growth_assets_experiment_id_fkey FOREIGN KEY (experiment_id) REFERENCES public.growth_experiments(id) ON DELETE SET NULL;


--
-- Name: growth_assets growth_assets_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_assets
    ADD CONSTRAINT growth_assets_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.growth_plans(id) ON DELETE CASCADE;


--
-- Name: growth_crm_flows growth_crm_flows_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_crm_flows
    ADD CONSTRAINT growth_crm_flows_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.growth_plans(id) ON DELETE CASCADE;


--
-- Name: growth_edm_campaigns growth_edm_campaigns_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_edm_campaigns
    ADD CONSTRAINT growth_edm_campaigns_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.growth_plans(id) ON DELETE CASCADE;


--
-- Name: growth_experiments growth_experiments_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_experiments
    ADD CONSTRAINT growth_experiments_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.growth_plans(id) ON DELETE CASCADE;


--
-- Name: growth_roas_models growth_roas_models_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_roas_models
    ADD CONSTRAINT growth_roas_models_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.growth_plans(id) ON DELETE CASCADE;


--
-- Name: growth_weekly_reviews growth_weekly_reviews_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_weekly_reviews
    ADD CONSTRAINT growth_weekly_reviews_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.growth_plans(id) ON DELETE CASCADE;


--
-- Name: intelligence_edm_history intelligence_edm_history_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intelligence_edm_history
    ADD CONSTRAINT intelligence_edm_history_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.intelligence_topics(topic_id) ON DELETE CASCADE;


--
-- Name: intelligence_news intelligence_news_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intelligence_news
    ADD CONSTRAINT intelligence_news_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.intelligence_sources(source_id) ON DELETE SET NULL;


--
-- Name: intelligence_news intelligence_news_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intelligence_news
    ADD CONSTRAINT intelligence_news_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.intelligence_topics(topic_id) ON DELETE CASCADE;


--
-- Name: intelligence_sources intelligence_sources_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intelligence_sources
    ADD CONSTRAINT intelligence_sources_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.intelligence_topics(topic_id) ON DELETE CASCADE;


--
-- Name: intelligence_summaries intelligence_summaries_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intelligence_summaries
    ADD CONSTRAINT intelligence_summaries_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.intelligence_topics(topic_id) ON DELETE CASCADE;


--
-- Name: media_assets media_assets_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_assets
    ADD CONSTRAINT media_assets_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.media_projects(id) ON DELETE CASCADE;


--
-- Name: media_assets media_assets_prompt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_assets
    ADD CONSTRAINT media_assets_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.media_prompts(id) ON DELETE SET NULL;


--
-- Name: media_prompts media_prompts_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_prompts
    ADD CONSTRAINT media_prompts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.media_projects(id) ON DELETE CASCADE;


--
-- Name: media_style_guides media_style_guides_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_style_guides
    ADD CONSTRAINT media_style_guides_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.media_projects(id) ON DELETE CASCADE;


--
-- Name: photo_booth_analytics photo_booth_analytics_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_booth_analytics
    ADD CONSTRAINT photo_booth_analytics_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.photo_booth_events(event_id);


--
-- Name: photo_booth_errors photo_booth_errors_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_booth_errors
    ADD CONSTRAINT photo_booth_errors_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.photo_booth_sessions(session_id) ON DELETE SET NULL;


--
-- Name: photo_booth_images photo_booth_images_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_booth_images
    ADD CONSTRAINT photo_booth_images_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.photo_booth_sessions(session_id) ON DELETE CASCADE;


--
-- Name: photo_booth_qr_codes photo_booth_qr_codes_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_booth_qr_codes
    ADD CONSTRAINT photo_booth_qr_codes_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.photo_booth_images(image_id) ON DELETE CASCADE;


--
-- Name: photo_booth_qr_codes photo_booth_qr_codes_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_booth_qr_codes
    ADD CONSTRAINT photo_booth_qr_codes_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.photo_booth_sessions(session_id) ON DELETE CASCADE;


--
-- Name: photo_booth_sessions photo_booth_sessions_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_booth_sessions
    ADD CONSTRAINT photo_booth_sessions_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.photo_booth_events(event_id);


--
-- Name: processing_logs processing_logs_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processing_logs
    ADD CONSTRAINT processing_logs_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.receipt_batches(batch_id) ON DELETE CASCADE;


--
-- Name: processing_logs processing_logs_receipt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processing_logs
    ADD CONSTRAINT processing_logs_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES public.receipts(receipt_id) ON DELETE CASCADE;


--
-- Name: raw_tender_captures raw_tender_captures_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.raw_tender_captures
    ADD CONSTRAINT raw_tender_captures_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.tender_source_registry(source_id);


--
-- Name: receipts receipts_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.receipt_batches(batch_id) ON DELETE CASCADE;


--
-- Name: recruitai_chat_messages recruitai_chat_messages_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruitai_chat_messages
    ADD CONSTRAINT recruitai_chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.recruitai_chat_sessions(session_id) ON DELETE CASCADE;


--
-- Name: recruitai_chat_sessions recruitai_chat_sessions_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruitai_chat_sessions
    ADD CONSTRAINT recruitai_chat_sessions_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.recruitai_leads(lead_id) ON DELETE SET NULL;


--
-- Name: social_ad_campaigns social_ad_campaigns_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_ad_campaigns
    ADD CONSTRAINT social_ad_campaigns_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.social_campaigns(task_id) ON DELETE CASCADE;


--
-- Name: social_artefacts social_artefacts_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_artefacts
    ADD CONSTRAINT social_artefacts_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.social_campaigns(task_id) ON DELETE CASCADE;


--
-- Name: social_campaigns social_campaigns_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_campaigns
    ADD CONSTRAINT social_campaigns_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.social_states(task_id) ON DELETE CASCADE;


--
-- Name: social_content_drafts social_content_drafts_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_content_drafts
    ADD CONSTRAINT social_content_drafts_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.social_campaigns(task_id) ON DELETE CASCADE;


--
-- Name: social_content_posts social_content_posts_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_content_posts
    ADD CONSTRAINT social_content_posts_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.social_campaigns(task_id) ON DELETE CASCADE;


--
-- Name: social_kpi_definitions social_kpi_definitions_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_kpi_definitions
    ADD CONSTRAINT social_kpi_definitions_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.social_campaigns(task_id) ON DELETE CASCADE;


--
-- Name: tenders tenders_canonical_tender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenders
    ADD CONSTRAINT tenders_canonical_tender_id_fkey FOREIGN KEY (canonical_tender_id) REFERENCES public.tenders(tender_id);


--
-- Name: tenders tenders_raw_pointer_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenders
    ADD CONSTRAINT tenders_raw_pointer_fkey FOREIGN KEY (raw_pointer) REFERENCES public.raw_tender_captures(capture_id);


--
-- Name: tenders tenders_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenders
    ADD CONSTRAINT tenders_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.tender_source_registry(source_id);


--
-- Name: ziwei_compatibility_analyses ziwei_compatibility_analyses_chart1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ziwei_compatibility_analyses
    ADD CONSTRAINT ziwei_compatibility_analyses_chart1_id_fkey FOREIGN KEY (chart1_id) REFERENCES public.ziwei_birth_charts(id) ON DELETE CASCADE;


--
-- Name: ziwei_compatibility_analyses ziwei_compatibility_analyses_chart2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ziwei_compatibility_analyses
    ADD CONSTRAINT ziwei_compatibility_analyses_chart2_id_fkey FOREIGN KEY (chart2_id) REFERENCES public.ziwei_birth_charts(id) ON DELETE CASCADE;


--
-- Name: ziwei_conversation_messages ziwei_conversation_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ziwei_conversation_messages
    ADD CONSTRAINT ziwei_conversation_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.ziwei_conversations(id) ON DELETE CASCADE;


--
-- Name: ziwei_conversations ziwei_conversations_chart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ziwei_conversations
    ADD CONSTRAINT ziwei_conversations_chart_id_fkey FOREIGN KEY (chart_id) REFERENCES public.ziwei_birth_charts(id) ON DELETE CASCADE;


--
-- Name: ziwei_enhanced_interpretations ziwei_enhanced_interpretations_chart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ziwei_enhanced_interpretations
    ADD CONSTRAINT ziwei_enhanced_interpretations_chart_id_fkey FOREIGN KEY (chart_id) REFERENCES public.ziwei_birth_charts(id) ON DELETE CASCADE;


--
-- Name: ziwei_insights ziwei_insights_chart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ziwei_insights
    ADD CONSTRAINT ziwei_insights_chart_id_fkey FOREIGN KEY (chart_id) REFERENCES public.ziwei_birth_charts(id) ON DELETE CASCADE;


--
-- Name: ziwei_rule_feedback ziwei_rule_feedback_chart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ziwei_rule_feedback
    ADD CONSTRAINT ziwei_rule_feedback_chart_id_fkey FOREIGN KEY (chart_id) REFERENCES public.ziwei_birth_charts(id) ON DELETE SET NULL;


--
-- Name: ziwei_rule_feedback ziwei_rule_feedback_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ziwei_rule_feedback
    ADD CONSTRAINT ziwei_rule_feedback_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.ziwei_interpretation_rules(id) ON DELETE CASCADE;


--
-- Name: ziwei_rule_statistics ziwei_rule_statistics_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ziwei_rule_statistics
    ADD CONSTRAINT ziwei_rule_statistics_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.ziwei_interpretation_rules(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


