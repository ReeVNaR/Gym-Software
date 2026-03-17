"use server";

import dbConnect from "@/lib/mongodb";
import { Member, ActivityLog, Payment } from "@/lib/models";

// Helper to convert mongoose docs to plain objects
const jsonify = (obj: any) => JSON.parse(JSON.stringify(obj));

export async function loginMember(email: string, password: string) {
    await dbConnect();
    const member = await Member.findOne({ email, password }).lean();
    return jsonify(member);
}

export async function registerMember(data: any) {
    await dbConnect();
    const existing = await Member.findOne({ email: data.email });
    if (existing) {
        throw new Error("Email already in use");
    }
    const member = await Member.create(data);
    return jsonify(member);
}

export async function getMember(memberId: string) {
    await dbConnect();
    const member = await Member.findById(memberId).lean();
    return jsonify(member);
}

export async function getMemberActivity(memberId: string) {
    await dbConnect();
    let activity = await ActivityLog.findOne({ member_id: memberId, check_out_time: null }).lean();
    if (!activity) {
        activity = await ActivityLog.findOne({ member_id: memberId }).sort({ check_in_time: -1 }).lean();
    }
    return jsonify(activity);
}

export async function getMemberHistory(memberId: string) {
    await dbConnect();
    const history = await ActivityLog.find({ member_id: memberId }).sort({ check_in_time: -1 }).lean();
    return jsonify(history);
}

export async function getLeaderboard() {
    await dbConnect();
    const members = await Member.find({}, 'id _id full_name plan status').lean();
    const logs = await ActivityLog.find({ duration_minutes: { $exists: true } }, 'member_id duration_minutes').lean();
    
    const xpMap: Record<string, number> = {};
    logs.forEach((log: any) => {
        if (log.duration_minutes) {
            const mId = log.member_id.toString();
            xpMap[mId] = (xpMap[mId] || 0) + log.duration_minutes;
        }
    });

    const leaderboard = members.map((m: any) => ({
        ...m,
        id: m._id.toString(),
        xp: xpMap[m._id.toString()] || 0
    })).sort((a: any, b: any) => b.xp - a.xp);

    return jsonify(leaderboard);
}

export async function getAllMembers() {
    await dbConnect();
    const members = await Member.find().sort({ created_at: -1 }).lean();
    return jsonify(members.map((m: any) => ({ ...m, id: m._id.toString() })));
}

export async function getPayments(memberId: string) {
    await dbConnect();
    const payments = await Payment.find({ member_id: memberId }).sort({ payment_date: -1 }).lean();
    return jsonify(payments.map((p: any) => ({ ...p, id: p._id.toString() })));
}

export async function addPayment(memberId: string, amount: number, paymentMethod: string) {
    await dbConnect();
    const payment = await Payment.create({
        member_id: memberId,
        amount,
        payment_method: paymentMethod,
        payment_date: new Date()
    });
    
    const member = await Member.findById(memberId);
    if (member) {
        member.due_amount = (member.due_amount || 0) - amount;
        await member.save();
    }
    return true;
}

export async function deletePaymentAction(paymentId: string) {
    await dbConnect();
    const payment = await Payment.findById(paymentId);
    if (!payment) return false;
    
    const member = await Member.findById(payment.member_id);
    if (member) {
        member.due_amount = (member.due_amount || 0) + payment.amount;
        await member.save();
    }
    await Payment.findByIdAndDelete(paymentId);
    return true;
}

export async function getActiveSessionsAction() {
    await dbConnect();
    const logs = await ActivityLog.find({ check_out_time: null }).lean();
    return jsonify(logs);
}

export async function deleteMemberAction(memberId: string) {
    await dbConnect();
    await Member.findByIdAndDelete(memberId);
    await ActivityLog.deleteMany({ member_id: memberId });
    await Payment.deleteMany({ member_id: memberId });
    return true;
}

export async function updateMemberAction(memberId: string, data: any) {
    await dbConnect();
    const updated = await Member.findByIdAndUpdate(memberId, data, { new: true }).lean();
    return jsonify({ ...updated, id: updated._id.toString() });
}

export async function handleScanAction(memberId: string) {
    await dbConnect();
    const member = await Member.findById(memberId);
    if (!member) throw new Error("Member not found!");

    const isCheckedIn = member.status === 'Active (In Gym)';
    const newStatus = isCheckedIn ? 'Active' : 'Active (In Gym)';

    member.status = newStatus;
    await member.save();

    let durationMinutes = 0;

    if (isCheckedIn) {
        const openLog = await ActivityLog.findOne({ member_id: memberId, check_out_time: null }).sort({ check_in_time: -1 });
        if (openLog) {
            const checkInTime = new Date(openLog.check_in_time).getTime();
            const checkOutTime = new Date().getTime();
            durationMinutes = Math.round((checkOutTime - checkInTime) / 1000 / 60);

            openLog.check_out_time = new Date();
            openLog.duration_minutes = durationMinutes;
            await openLog.save();
        }
    } else {
        const staleLogs = await ActivityLog.find({ member_id: memberId, check_out_time: null });
        for (const log of staleLogs) {
            const checkInTime = new Date(log.check_in_time).getTime();
            const now = new Date().getTime();
            log.check_out_time = new Date();
            log.duration_minutes = Math.round((now - checkInTime) / 1000 / 60);
            await log.save();
        }

        await ActivityLog.create({
            member_id: memberId,
            check_in_time: new Date()
        });
    }

    return { member: jsonify({ ...member.toObject(), id: member._id.toString() }), isCheckedIn, durationMinutes };
}
