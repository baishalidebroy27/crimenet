import logging
from app.db.neo4j_client import neo4j_client

logger = logging.getLogger(__name__)

class AnalyticsPipeline:
    def __init__(self):
        self.driver = neo4j_client.get_driver()

    async def run_algorithms(self):
        logger.info("Running Graph Analytics (PageRank & Louvain)")
        if not self.driver:
            return
            
        async with self.driver.session() as session:
            try:
                await session.run("CALL gds.graph.drop('crimenet_graph', false)")
                await session.run("""
                    CALL gds.graph.project(
                      'crimenet_graph',
                      'Person',
                      ['KNOWS', 'CALLED', 'ASSOCIATED_WITH']
                    )
                """)
                logger.info("Graph projected to GDS memory")
            except Exception as e:
                logger.error(f"Error projecting graph: {e}")
                return
                
            try:
                await session.run("""
                    CALL gds.pageRank.write('crimenet_graph', {
                        maxIterations: 20,
                        dampingFactor: 0.85,
                        writeProperty: 'pagerank_score'
                    })
                """)
                logger.info("PageRank completed")
            except Exception as e:
                logger.error(f"Error running PageRank: {e}")
                
            try:
                await session.run("""
                    CALL gds.louvain.write('crimenet_graph', {
                        writeProperty: 'community_id'
                    })
                """)
                logger.info("Louvain Community Detection completed")
            except Exception as e:
                logger.error(f"Error running Louvain: {e}")
