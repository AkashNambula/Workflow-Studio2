from celery import Celery

celery_app = Celery(
    "workflow_studio",
    broker="redis://redis-service:6379/0",
    backend="redis://redis-service:6379/1"
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],

    # Reliability settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    # The Kubernetes service can be briefly unavailable while DNS/Redis is
    # recovering. Retrying the broker connection prevents a transient queue
    # lookup from becoming an immediate Run Workflow 503.
    broker_connection_retry_on_startup=True,
    broker_connection_max_retries=3,
)

celery_app.autodiscover_tasks(["app.worker"])
