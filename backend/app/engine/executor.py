import asyncio
import logging
import datetime
from typing import List, Dict, Any
from app.nodes.email_node import EmailNode
from app.nodes.delay_node import DelayNode
from app.nodes.sms_node import SmsNode
from app.nodes.pdf_node import PdfNode
from app.nodes.condition_node import ConditionNode
from app.nodes.http_node import HTTPRequestNode
from app.engine.retry import retryable
from app.websocket.live_logs import broadcast_node_state

logger = logging.getLogger("uvicorn.error")

@retryable(max_attempts=3, base_delay=1.0)
async def async_email_dispatch(node_data: Dict[str, Any], email: str, name: str, role: str, date: str, pdf: Any) -> None:
    EmailNode().execute(
        receiver_email=email, name=name, role=role, joining_date=date,
        subject=node_data.get("subject", "Welcome"),
        message=node_data.get("message", "Welcome to our company"),
        pdf_path=pdf
    )

@retryable(max_attempts=3, base_delay=1.0)
async def async_sms_dispatch(phone: str, name: str) -> None:
    SmsNode().execute(phone, name)

@retryable(max_attempts=3, base_delay=1.0)
async def async_http_dispatch(node_data: Dict[str, Any]) -> Dict[str, Any]:
    return await HTTPRequestNode().execute(
        url=node_data.get("url", ""),
        method=node_data.get("method", "GET"),
        payload=node_data.get("payload", {})
    )

async def run_workflow(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]], employees: List[Any], run_id: str, workflow_name: str = "Workflow") -> List[str]:
    logs = []
    node_map = {str(node["id"]): node for node in nodes if isinstance(node, dict) and "id" in node}
    
    current_node_id = str(edges[0].get("source")) if edges and isinstance(edges[0], dict) else (getattr(edges[0], 'source', None) if edges else None)
    generated_pdf = None

    while current_node_id:
        current_node_id = str(current_node_id)
        if current_node_id not in node_map:
            break
            
        current_node = node_map[current_node_id]
        node_type_normalized = str(current_node.get("type", "")).lower()

        # 🟢 FIX: Broadcast states onto WebSocket active pools dynamically
        await broadcast_node_state(run_id, current_node_id, "RUNNING")

        for employee in employees:
            emp_name = str(getattr(employee, 'name', '')) if hasattr(employee, 'name') else (employee.get('name', '') if isinstance(employee, dict) else '')
            emp_email = str(getattr(employee, 'email', '')) if hasattr(employee, 'email') else (employee.get('email', '') if isinstance(employee, dict) else '')
            emp_phone = str(getattr(employee, 'phone', '')) if hasattr(employee, 'phone') else (employee.get('phone', '') if isinstance(employee, dict) else '')
            emp_role = str(getattr(employee, 'role', '')) if hasattr(employee, 'role') else (employee.get('role', '') if isinstance(employee, dict) else '')
            emp_date = str(getattr(employee, 'joining_date', '')) if hasattr(employee, 'joining_date') else (employee.get('joining_date', '') if isinstance(employee, dict) else '')

            if "condition" in node_type_normalized:
                condition_result = ConditionNode().execute(
                    employee_name=emp_name, employee_email=emp_email,
                    employee_phone=emp_phone, employee_role=emp_role, joining_date=emp_date
                )

                if condition_result:
                    logs.append(f"🟢 Condition SUCCESS validation passed for {emp_name}.")
                    next_edge = next((e for e in edges if str(e.get("source") if isinstance(e, dict) else getattr(e, 'source', '')) == current_node_id and "true" in str(e.get("sourceHandle") if isinstance(e, dict) else getattr(e, 'sourceHandle', '')).lower()), None)
                    current_node_id = str(next_edge.get("target")) if next_edge and isinstance(next_edge, dict) else (getattr(next_edge, 'target', None) if next_edge else None)
                else:
                    logs.append(f"🔴 Condition FAILED validation for {emp_name}.")
                    next_edge = next((e for e in edges if str(e.get("source") if isinstance(e, dict) else getattr(e, 'source', '')) == current_node_id and "false" in str(e.get("sourceHandle") if isinstance(e, dict) else getattr(e, 'sourceHandle', '')).lower()), None)
                    current_node_id = str(next_edge.get("target")) if next_edge and isinstance(next_edge, dict) else (getattr(next_edge, 'target', None) if next_edge else None)
                break

            elif "pdf" in node_type_normalized:
                generated_pdf = PdfNode().execute(
                    employee_name=emp_name, employee_email=emp_email, role=emp_role,
                    joining_date=emp_date, workflow_name=workflow_name,
                    pdf_title=current_node.get("pdf_title", "Welcome_Letter")
                )
                logs.append(f"Document generation complete: {generated_pdf}")

            elif "email" in node_type_normalized:
                await async_email_dispatch(current_node, emp_email, emp_name, emp_role, emp_date, generated_pdf)
                logs.append(f"Email template parsed out and sent successfully to: {emp_email}")

            elif "sms" in node_type_normalized:
                await async_sms_dispatch(emp_phone, emp_name)
                logs.append(f"SMS alert broadcast dispatched to: {emp_phone}")

            elif "http" in node_type_normalized:
                res = await async_http_dispatch(current_node)
                logs.append(f"HTTP Request Node call status returned: {res.get('status_code')}")

            elif "delay" in node_type_normalized:
                delay_seconds = int(current_node.get("delay", 5))
                # 🟢 FIXED: Non-blocking task loop execution sleep pattern
                await asyncio.sleep(delay_seconds)
                logs.append(f"Workflow pipeline suspended asynchronously for {delay_seconds}s.")

        await broadcast_node_state(run_id, current_node_id, "COMPLETED")

        if "condition" not in node_type_normalized:
            next_edge_generic = next((e for e in edges if str(e.get("source") if isinstance(e, dict) else getattr(e, 'source', '')) == current_node_id), None)
            current_node_id = str(next_edge_generic.get("target")) if next_edge_generic and isinstance(next_edge_generic, dict) else (getattr(next_edge_generic, 'target', None) if next_edge_generic else None)

    logs.append("Workflow completed")
    return logs