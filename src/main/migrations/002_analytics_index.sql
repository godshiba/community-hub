-- Composite index for analytics queries filtering by metric_name + timestamp + platform
CREATE INDEX IF NOT EXISTS idx_stats_metric_time ON platform_stats(metric_name, timestamp, platform);
