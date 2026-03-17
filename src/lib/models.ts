import mongoose from 'mongoose';

const MemberSchema = new mongoose.Schema({
    full_name: String,
    email: { type: String, unique: true },
    password: { type: String },
    phone: String,
    plan: { type: String, default: 'Monthly Plan' },
    status: { type: String, default: 'Pending' },
    due_amount: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

export const Member = mongoose.models.Member || mongoose.model('Member', MemberSchema);

const ActivityLogSchema = new mongoose.Schema({
    member_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    check_in_time: { type: Date, default: Date.now },
    check_out_time: { type: Date },
    duration_minutes: { type: Number },
    created_at: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

export const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);

const PaymentSchema = new mongoose.Schema({
    member_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    amount: { type: Number, required: true },
    payment_date: { type: Date, default: Date.now },
    payment_method: { type: String, default: 'Cash' },
    created_at: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

export const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
