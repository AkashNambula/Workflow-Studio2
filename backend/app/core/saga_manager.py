from app.models.saga_state import SagaState, SagaStatus

from app.nodes.email_node import EmailNode
from app.nodes.pdf_node import PdfNode
from app.nodes.sms_node import SmsNode
from app.nodes.delay_node import DelayNode
from app.nodes.http_node import HTTPRequestNode
from app.nodes.condition_node import ConditionNode


class SagaManager:

    @staticmethod
    def start(run_id: str):
        SagaState.update_status(
            run_id,
            SagaStatus.RUNNING
        )

    @staticmethod
    def complete(run_id: str):
        SagaState.update_status(
            run_id,
            SagaStatus.COMPLETED
        )

    @staticmethod
    def fail(run_id: str):
        SagaState.update_status(
            run_id,
            SagaStatus.FAILED
        )

    @staticmethod
    def start_compensation(run_id: str):
        SagaState.update_status(
            run_id,
            SagaStatus.COMPENSATING
        )

    @staticmethod
    def compensated(run_id: str):
        SagaState.update_status(
            run_id,
            SagaStatus.COMPENSATED
        )

    @staticmethod
    def update_current_node(
        run_id: str,
        node_id: str
    ):
        SagaState.update_current_node(
            run_id,
            node_id
        )

    @staticmethod
    def mark_completed(
        run_id: str,
        node_id: str,
        node_type: str
    ):
        SagaState.add_completed_node(
            run_id,
            {
                "node_id": node_id,
                "node_type": node_type
            }
        )

    @staticmethod
    def get_state(run_id: str):
        return SagaState.get(run_id)

    @staticmethod
    async def rollback(
        run_id: str,
        context: dict = None
    ):

        context = context or {}

        saga = SagaState.get(run_id)

        if not saga:
            return

        SagaManager.start_compensation(run_id)

        completed_nodes = saga.get(
            "completed_nodes",
            []
        )

        completed_nodes.reverse()

        for node in completed_nodes:

            node_type = node["node_type"].lower()

            print(
                f"[SAGA] Rolling back "
                f"{node_type} "
                f"Node ({node['node_id']})"
            )

            try:

                if "email" in node_type:
                    await EmailNode().compensate({})

                elif "pdf" in node_type:
                    await PdfNode().compensate(context)

                elif "sms" in node_type:
                    await SmsNode().compensate({})

                elif "http" in node_type:
                    await HTTPRequestNode().compensate({})

                elif "delay" in node_type:
                    await DelayNode().compensate({})

                elif "condition" in node_type:
                    await ConditionNode().compensate({})

            except Exception as e:

                print(
                    f"[SAGA] Compensation Failed for "
                    f"{node_type}: {e}"
                )

        SagaManager.compensated(run_id)