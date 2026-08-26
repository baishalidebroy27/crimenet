from fastapi import APIRouter
from app.models.schemas import GraphResponse, GraphNode, GraphEdge, GraphResponseStats
from app.db.neo4j_client import neo4j_client

router = APIRouter()

@router.get("/graph", response_model=GraphResponse)
async def get_graph(risk_threshold: int = 0, source_type: str = None, limit: int = 100):
    driver = neo4j_client.get_driver()
    nodes = []
    edges = []
    
    with driver.session() as session:
        node_query = """
        MATCH (n)
        WHERE coalesce(n.risk_score, 0) >= $risk_threshold
        RETURN id(n) as id, labels(n)[0] as type, coalesce(n.name, n.label, "Entity") as label, coalesce(n.risk_score, 0) as risk_score
        LIMIT $limit
        """
        node_results = session.run(node_query, risk_threshold=risk_threshold, limit=limit)
        
        node_ids = []
        for record in node_results:
            node_id_int = record["id"]
            node_ids.append(node_id_int)
            nodes.append(GraphNode(
                id=str(node_id_int),
                label=str(record["label"]),
                type=str(record["type"]),
                risk_score=record["risk_score"]
            ))
            
        if node_ids:
            edge_query = """
            MATCH (n)-[r]->(m)
            WHERE id(n) IN $node_ids AND id(m) IN $node_ids
            RETURN id(r) as id, id(n) as source, id(m) as target, type(r) as type, coalesce(r.weight, 0.5) as weight
            """
            edge_results = session.run(edge_query, node_ids=node_ids)
            for record in edge_results:
                edges.append(GraphEdge(
                    id=str(record["id"]),
                    source=str(record["source"]),
                    target=str(record["target"]),
                    type=str(record["type"]),
                    weight=float(record["weight"])
                ))
                
    stats = GraphResponseStats(
        total_nodes=len(nodes),
        total_edges=len(edges),
        nodes_returned=len(nodes),
        edges_returned=len(edges)
    )
    
    return GraphResponse(nodes=nodes, edges=edges, stats=stats)

@router.get("/graph/node/{node_id}")
async def get_node(node_id: str):
    return {"node": {"id": node_id}, "connections": []}

@router.get("/graph/path")
async def get_path(source_id: str, target_id: str):
    return {"path_found": False, "message": "Mock response"}
