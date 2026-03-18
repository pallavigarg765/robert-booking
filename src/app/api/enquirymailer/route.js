import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const { recipient, enquiries } = await req.json();

    if (!recipient || !Array.isArray(enquiries) || enquiries.length === 0) {
      return new Response(
        JSON.stringify({ success: false, data: [] }),
        { status: 200 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Build the enquiry table HTML
    const enquiryRows = enquiries
      .map(
        (e) => `
          <tr>
            <td style="border:1px solid #ddd;padding:8px;">${e.name}</td>
            <td style="border:1px solid #ddd;padding:8px;">${e.email}</td>
            <td style="border:1px solid #ddd;padding:8px;">${e.phone}</td>
            <td style="border:1px solid #ddd;padding:8px;">${e.city}</td>
            <td style="border:1px solid #ddd;padding:8px;">${e.state}</td>
          </tr>
        `
      )
      .join("");

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin:auto;">
        <h2>Selected Enquiries</h2>
        <table style="width:100%; border-collapse:collapse; margin-top:10px;">
          <thead>
            <tr style="background-color:#f2f2f2;">
              <th style="border:1px solid #ddd;padding:8px;">Name</th>
              <th style="border:1px solid #ddd;padding:8px;">Email</th>
              <th style="border:1px solid #ddd;padding:8px;">Phone</th>
              <th style="border:1px solid #ddd;padding:8px;">City</th>
              <th style="border:1px solid #ddd;padding:8px;">State</th>
            </tr>
          </thead>
          <tbody>${enquiryRows}</tbody>
        </table>
        <p style="margin-top:20px;">Sent from Enquiry Management Dashboard.</p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipient,
      subject: `Enquiry Details (${enquiries.length} Selected)`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Enquiry email sent to ${recipient}: ${info.response}`);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending email:", error);
     return new Response(
      JSON.stringify({ success: false, data: [] }),
      { status: 200 }
    );
  }
}
