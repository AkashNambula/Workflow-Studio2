from pydantic import BaseModel
from typing import List


class Node(BaseModel):
    id: str
    type: str


class Edge(BaseModel):
    source: str
    target: str


class Workflow(BaseModel):
    name: str
    nodes: List[Node]
    edges: List[Edge]