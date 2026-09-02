-- ==============================================================================
-- TASQ-ONE REALTIME DELETE EVENT REPLICATION (0010_tasks_replica_identity_full.sql)
-- Ensures WAL replication carries old row values (especially org_id) on DELETE
-- ==============================================================================

alter table if exists public.tasks replica identity full;
