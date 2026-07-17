from backend.config.database import db
from datetime import datetime

class TelemetryLog(db.Model):
    __tablename__ = 'telemetry_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    cpu_load = db.Column(db.Float, nullable=False)
    ram_usage = db.Column(db.Float, nullable=False)
    db_connections = db.Column(db.Integer, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'cpu_load': self.cpu_load,
            'ram_usage': self.ram_usage,
            'db_connections': self.db_connections,
            'timestamp': self.timestamp.strftime('%Y-%m-%d %H:%M:%S') if self.timestamp else None
        }
