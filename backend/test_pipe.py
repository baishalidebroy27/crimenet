import asyncio
from app.pipelines.sources.fir_pipeline import FIRPipeline

async def run():
    pipeline = FIRPipeline("test_id")
    raw = await pipeline.extract("../demo_fir_2.txt")
    processed = await pipeline.process(raw)
    print("Processed:", processed)
    entities = await pipeline.extract_entities(processed)
    print("Entities:", entities)

if __name__ == "__main__":
    asyncio.run(run())
