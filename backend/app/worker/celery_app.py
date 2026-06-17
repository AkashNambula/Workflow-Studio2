from celery import Celery

celery_app = Celery(
"workflow_studio",
broker="redis://redis-service:6379/0",
backend="redis://redis-service:6379/1"
)

celery_app.conf.update(
task_serializer="json",
result_serializer="json",
accept_content=["json"]
)

celery_app.autodiscover_tasks(["app.worker"])
