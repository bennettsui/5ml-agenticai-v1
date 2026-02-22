#!/usr/bin/env python3
"""
Ziwei Chart Calculator - JSON API Wrapper
Accepts JSON input and returns calculated chart as JSON
Used by Node.js backend API
"""

import json
import sys
from pathlib import Path

# Import the calculator module
# Load the module dynamically since it has a hyphen in the name
import importlib.util
spec = importlib.util.spec_from_file_location(
    "ziwei_chart_calculator",
    str(Path(__file__).parent / "ziwei-chart-calculator.py")
)
calc_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(calc_module)

BirthData = calc_module.BirthData
calculate_natal_chart = calc_module.calculate_natal_chart
format_chart_output = calc_module.format_chart_output
FOUR_TRANSFORMATIONS_BY_YEAR_STEM = calc_module.FOUR_TRANSFORMATIONS_BY_YEAR_STEM


def calculate_from_json(json_str: str) -> dict:
    """
    Calculate Ziwei chart from JSON input

    Args:
        json_str: JSON string with birth data

    Returns:
        Dictionary with chart data and success status
    """
    try:
        # Parse input
        input_data = json.loads(json_str)

        # Create BirthData object
        birth = BirthData(
            year_stem=input_data.get("year_stem"),
            year_branch=input_data.get("year_branch"),
            lunar_month=int(input_data.get("lunar_month")),
            lunar_day=int(input_data.get("lunar_day")),
            hour_branch=input_data.get("hour_branch"),
            gender=input_data.get("gender", "M"),
            name=input_data.get("name"),
            location=input_data.get("location")
        )

        # Calculate chart
        chart = calculate_natal_chart(birth)

        # Format output
        output = format_chart_output(chart)
        output["success"] = True

        return output

    except json.JSONDecodeError as e:
        return {
            "success": False,
            "error": f"Invalid JSON: {str(e)}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "Usage: python ziwei-api-wrapper.py '<json_input>'"
        }))
        sys.exit(1)

    # Get JSON input from command line
    json_input = sys.argv[1]

    # Calculate chart
    result = calculate_from_json(json_input)

    # Output JSON
    print(json.dumps(result, ensure_ascii=False, indent=2))

    # Exit with error code if calculation failed
    if not result.get("success"):
        sys.exit(1)
