#!/usr/bin/env python3
"""
Automated metrics aggregation pipeline for Vision + LLM Monitoring System.
This script aggregates metrics from InfluxDB and generates daily/weekly/monthly reports.
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
from influxdb_client import InfluxDBClient
from influxdb_client.client.write_api import SYNCHRONOUS
import pandas as pd
import json
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MetricsAggregationPipeline:
    """Automated metrics aggregation pipeline."""
    
    def __init__(self):
        """Initialize the pipeline."""
        self.influx_url = os.getenv("INFLUXDB_URL", "http://localhost:8086")
        self.influx_token = os.getenv("INFLUXDB_TOKEN", "my-token")
        self.influx_org = os.getenv("INFLUXDB_ORG", "vision-monitor")
        self.influx_bucket = os.getenv("INFLUXDB_BUCKET", "metrics")
        
        self.client = InfluxDBClient(
            url=self.influx_url,
            token=self.influx_token,
            org=self.influx_org
        )
        self.query_api = self.client.query_api()
        self.write_api = self.client.write_api(write_options=SYNCHRONOUS)
    
    def aggregate_daily_metrics(self, date: datetime = None) -> Dict[str, Any]:
        """Aggregate metrics for a specific day."""
        if date is None:
            date = datetime.utcnow()
        
        start_time = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_time = start_time + timedelta(days=1)
        
        logger.info(f"Aggregating metrics for date: {start_time.date()}")
        
        # Query total requests
        total_requests_query = f'''
        from(bucket: "{self.influx_bucket}")
          |> range(start: {start_time.isoformat()}Z, stop: {end_time.isoformat()}Z)
          |> filter(fn: (r) => r["_measurement"] == "inference_requests")
          |> count()
        '''
        
        # Query average latency
        avg_latency_query = f'''
        from(bucket: "{self.influx_bucket}")
          |> range(start: {start_time.isoformat()}Z, stop: {end_time.isoformat()}Z)
          |> filter(fn: (r) => r["_measurement"] == "inference_latency")
          |> mean(column: "_value")
        '''
        
        # Query average hallucination score
        avg_hallucination_query = f'''
        from(bucket: "{self.influx_bucket}")
          |> range(start: {start_time.isoformat()}Z, stop: {end_time.isoformat()}Z)
          |> filter(fn: (r) => r["_measurement"] == "hallucination_scores")
          |> mean(column: "_value")
        '''
        
        # Query error rate
        error_query = f'''
        from(bucket: "{self.influx_bucket}")
          |> range(start: {start_time.isoformat()}Z, stop: {end_time.isoformat()}Z)
          |> filter(fn: (r) => r["_measurement"] == "inference_requests" and r["status"] == "failed")
          |> count()
        '''
        
        # Execute queries
        try:
            total_requests = self.query_api.query(total_requests_query)
            avg_latency = self.query_api.query(avg_latency_query)
            avg_hallucination = self.query_api.query(avg_hallucination_query)
            error_count = self.query_api.query(error_query)
            
            # Extract values
            total_requests_val = self._extract_value(total_requests) or 0
            avg_latency_val = self._extract_value(avg_latency) or 0
            avg_hallucination_val = self._extract_value(avg_hallucination) or 0
            error_count_val = self._extract_value(error_count) or 0
            
            error_rate = (error_count_val / total_requests_val * 100) if total_requests_val > 0 else 0
            
            metrics = {
                "date": start_time.date().isoformat(),
                "total_requests": total_requests_val,
                "avg_latency_ms": avg_latency_val,
                "avg_hallucination_score": avg_hallucination_val,
                "error_count": error_count_val,
                "error_rate": error_rate
            }
            
            logger.info(f"Daily metrics aggregated: {metrics}")
            return metrics
            
        except Exception as e:
            logger.error(f"Error aggregating daily metrics: {e}")
            raise
    
    def aggregate_weekly_metrics(self, end_date: datetime = None) -> Dict[str, Any]:
        """Aggregate metrics for the past week."""
        if end_date is None:
            end_date = datetime.utcnow()
        
        start_date = end_date - timedelta(days=7)
        
        logger.info(f"Aggregating weekly metrics from {start_date.date()} to {end_date.date()}")
        
        # Aggregate daily metrics for each day in the week
        daily_metrics = []
        current_date = start_date
        
        while current_date < end_date:
            daily = self.aggregate_daily_metrics(current_date)
            daily_metrics.append(daily)
            current_date += timedelta(days=1)
        
        # Calculate weekly aggregates
        total_requests = sum(m["total_requests"] for m in daily_metrics)
        avg_latency = sum(m["avg_latency_ms"] for m in daily_metrics) / len(daily_metrics) if daily_metrics else 0
        avg_hallucination = sum(m["avg_hallucination_score"] for m in daily_metrics) / len(daily_metrics) if daily_metrics else 0
        total_errors = sum(m["error_count"] for m in daily_metrics)
        error_rate = (total_errors / total_requests * 100) if total_requests > 0 else 0
        
        weekly_metrics = {
            "week_start": start_date.date().isoformat(),
            "week_end": end_date.date().isoformat(),
            "total_requests": total_requests,
            "avg_latency_ms": avg_latency,
            "avg_hallucination_score": avg_hallucination,
            "total_errors": total_errors,
            "error_rate": error_rate,
            "daily_breakdown": daily_metrics
        }
        
        logger.info(f"Weekly metrics aggregated: {weekly_metrics}")
        return weekly_metrics
    
    def aggregate_monthly_metrics(self, year: int = None, month: int = None) -> Dict[str, Any]:
        """Aggregate metrics for a specific month."""
        if year is None:
            year = datetime.utcnow().year
        if month is None:
            month = datetime.utcnow().month
        
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        
        logger.info(f"Aggregating monthly metrics for {year}-{month:02d}")
        
        # Aggregate daily metrics for each day in the month
        daily_metrics = []
        current_date = start_date
        
        while current_date < end_date:
            daily = self.aggregate_daily_metrics(current_date)
            daily_metrics.append(daily)
            current_date += timedelta(days=1)
        
        # Calculate monthly aggregates
        total_requests = sum(m["total_requests"] for m in daily_metrics)
        avg_latency = sum(m["avg_latency_ms"] for m in daily_metrics) / len(daily_metrics) if daily_metrics else 0
        avg_hallucination = sum(m["avg_hallucination_score"] for m in daily_metrics) / len(daily_metrics) if daily_metrics else 0
        total_errors = sum(m["error_count"] for m in daily_metrics)
        error_rate = (total_errors / total_requests * 100) if total_requests > 0 else 0
        
        monthly_metrics = {
            "year": year,
            "month": month,
            "total_requests": total_requests,
            "avg_latency_ms": avg_latency,
            "avg_hallucination_score": avg_hallucination,
            "total_errors": total_errors,
            "error_rate": error_rate,
            "daily_breakdown": daily_metrics
        }
        
        logger.info(f"Monthly metrics aggregated: {monthly_metrics}")
        return monthly_metrics
    
    def save_aggregated_metrics(self, metrics: Dict[str, Any], period: str):
        """Save aggregated metrics to a file."""
        output_dir = "aggregated_metrics"
        os.makedirs(output_dir, exist_ok=True)
        
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{output_dir}/{period}_metrics_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump(metrics, f, indent=2)
        
        logger.info(f"Aggregated metrics saved to {filename}")
        return filename
    
    def _extract_value(self, query_result) -> float:
        """Extract numeric value from InfluxDB query result."""
        if not query_result:
            return None
        
        for table in query_result:
            for record in table.records:
                return record.get_value()
        
        return None
    
    def generate_report(self, metrics: Dict[str, Any], period: str) -> str:
        """Generate a human-readable report."""
        report = f"""
Vision + LLM Monitoring System - {period.capitalize()} Report
{'=' * 60}
Generated: {datetime.utcnow().isoformat()}

Summary:
--------
Total Requests: {metrics.get('total_requests', 0):,}
Average Latency: {metrics.get('avg_latency_ms', 0):.2f} ms
Average Hallucination Score: {metrics.get('avg_hallucination_score', 0):.3f}
Error Rate: {metrics.get('error_rate', 0):.2f}%
Total Errors: {metrics.get('total_errors', 0):,}

{'=' * 60}
"""
        return report
    
    def run_daily_aggregation(self):
        """Run the daily aggregation pipeline."""
        logger.info("Starting daily metrics aggregation pipeline")
        
        try:
            # Aggregate daily metrics
            daily_metrics = self.aggregate_daily_metrics()
            
            # Save metrics
            self.save_aggregated_metrics(daily_metrics, "daily")
            
            # Generate report
            report = self.generate_report(daily_metrics, "daily")
            logger.info(f"\n{report}")
            
            return daily_metrics
            
        except Exception as e:
            logger.error(f"Daily aggregation failed: {e}")
            raise
    
    def run_weekly_aggregation(self):
        """Run the weekly aggregation pipeline."""
        logger.info("Starting weekly metrics aggregation pipeline")
        
        try:
            # Aggregate weekly metrics
            weekly_metrics = self.aggregate_weekly_metrics()
            
            # Save metrics
            self.save_aggregated_metrics(weekly_metrics, "weekly")
            
            # Generate report
            report = self.generate_report(weekly_metrics, "weekly")
            logger.info(f"\n{report}")
            
            return weekly_metrics
            
        except Exception as e:
            logger.error(f"Weekly aggregation failed: {e}")
            raise
    
    def run_monthly_aggregation(self):
        """Run the monthly aggregation pipeline."""
        logger.info("Starting monthly metrics aggregation pipeline")
        
        try:
            # Aggregate monthly metrics
            monthly_metrics = self.aggregate_monthly_metrics()
            
            # Save metrics
            self.save_aggregated_metrics(monthly_metrics, "monthly")
            
            # Generate report
            report = self.generate_report(monthly_metrics, "monthly")
            logger.info(f"\n{report}")
            
            return monthly_metrics
            
        except Exception as e:
            logger.error(f"Monthly aggregation failed: {e}")
            raise


if __name__ == "__main__":
    import sys
    
    pipeline = MetricsAggregationPipeline()
    
    if len(sys.argv) > 1:
        period = sys.argv[1]
        
        if period == "daily":
            pipeline.run_daily_aggregation()
        elif period == "weekly":
            pipeline.run_weekly_aggregation()
        elif period == "monthly":
            pipeline.run_monthly_aggregation()
        else:
            logger.error(f"Unknown period: {period}. Use 'daily', 'weekly', or 'monthly'")
    else:
        # Default to daily aggregation
        pipeline.run_daily_aggregation()
