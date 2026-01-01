
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

declare const Deno: any;

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);
    const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];
    
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const logs: string[] = [];
    let sentCount = 0;

    // 1. CHECK LOANS DUE IN 3 DAYS
    const { data: dueLoans, error: loanError } = await supabase
      .from('loans')
      .select('*, members(fullName, email, phone)')
      .eq('status', 'ACTIVE')
      .eq('dueDate', threeDaysStr);

    if (dueLoans) {
      for (const loan of dueLoans) {
        const member = loan.members;
        if (!member) continue;

        const message = `Reminder: Your loan repayment of ${loan.principal.toLocaleString()} RWF is due on ${loan.dueDate}.`;

        // A. In-App Notification
        await supabase.from('notifications').insert({
          id: `notif_loan_${Date.now()}_${loan.id}`,
          title: 'Loan Due Soon',
          message: message,
          date: new Date().toISOString(),
          read: false,
          type: 'WARNING'
        });

        // B. Email Notification
        if (member.email && RESEND_API_KEY) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "VJN Reminders <notifications@amatsinda.vjn.org.rw>",
              to: member.email,
              subject: "Upcoming Loan Due Date",
              html: `<p>Dear ${member.fullName},</p><p>${message}</p><p>Please ensure your account is funded.</p>`,
            }),
          });
          sentCount++;
        }
        logs.push(`Notified ${member.fullName} about loan due ${loan.dueDate}`);
      }
    }

    // 2. CHECK MEETINGS TOMORROW
    const { data: meetings } = await supabase
        .from('meetings')
        .select('*, groups(name)')
        .eq('date', tomorrowStr);

    if (meetings) {
        for (const meeting of meetings) {
            // Get all active members of this group
            const { data: groupMembers } = await supabase
                .from('members')
                .select('fullName, email')
                .eq('groupId', meeting.groupId)
                .eq('status', 'ACTIVE');

            if (groupMembers) {
                const groupName = meeting.groups?.name || 'Your Group';
                const msg = `Reminder: ${groupName} meeting is scheduled for tomorrow (${meeting.date}).`;

                // Single In-App Broadcast (Simulated by creating one, usually would create one per user)
                await supabase.from('notifications').insert({
                    id: `notif_meet_${Date.now()}_${meeting.id}`,
                    title: 'Meeting Tomorrow',
                    message: msg,
                    date: new Date().toISOString(),
                    read: false,
                    type: 'INFO'
                });

                // Batch Email (Simulated loop)
                for (const m of groupMembers) {
                    if (m.email && RESEND_API_KEY) {
                        await fetch("https://api.resend.com/emails", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${RESEND_API_KEY}`,
                            },
                            body: JSON.stringify({
                                from: "VJN Reminders <notifications@amatsinda.vjn.org.rw>",
                                to: m.email,
                                subject: "Meeting Reminder",
                                html: `<p>Hello ${m.fullName},</p><p>${msg}</p>`,
                            }),
                        });
                        sentCount++;
                    }
                }
                logs.push(`Notified ${groupMembers.length} members about meeting on ${meeting.date}`);
            }
        }
    }

    return new Response(JSON.stringify({ success: true, sent: sentCount, logs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
