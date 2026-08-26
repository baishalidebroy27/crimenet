from abc import ABC, abstractmethod

class BasePipeline(ABC):
    def __init__(self, upload_id: str):
        self.upload_id = upload_id

    @abstractmethod
    async def extract(self, file_path: str):
        pass

    @abstractmethod
    async def process(self, raw_data):
        pass

    @abstractmethod
    async def extract_entities(self, processed_data):
        pass

    @abstractmethod
    async def store(self, entities):
        pass

    async def run(self, file_path: str):
        raw_data = await self.extract(file_path)
        processed_data = await self.process(raw_data)
        entities = await self.extract_entities(processed_data)
        await self.store(entities)
        return entities
