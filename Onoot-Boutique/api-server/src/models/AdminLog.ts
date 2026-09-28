import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminLog extends Document {
  action: string;
  resource: string;
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
}

const AdminLogSchema: Schema = new Schema({
  action: { type: String, required: true },
  resource: { type: String, required: true },
  oldValue: { type: Schema.Types.Mixed },
  newValue: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});

export const AdminLog = mongoose.model<IAdminLog>('AdminLog', AdminLogSchema);
