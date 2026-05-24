const emailTemplates = {
  /**
   * Booking Confirmation Template
   */
  bookingConfirmation: (data) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden; border: 1px solid #eee;">
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px; letter-spacing: 1px;">EthioCampGround</h1>
        <p style="margin: 10px 0 0; opacity: 0.9;">Adventure Awaits!</p>
      </div>
      <div style="padding: 40px 30px; background-color: white;">
        <h2 style="color: #1f2937; margin-top: 0;">Booking Confirmed!</h2>
        <p style="color: #4b5563; line-height: 1.6;">Hello <strong>${data.guestName}</strong>,</p>
        <p style="color: #4b5563; line-height: 1.6;">Your reservation at <strong>${data.campName}</strong> has been successfully created. Here are your booking details:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Reservation Code</td>
              <td style="padding: 8px 0; color: #111827; font-weight: bold; text-align: right;">${data.reservationCode}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Check-In</td>
              <td style="padding: 8px 0; color: #111827; text-align: right;">${new Date(data.checkIn).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Check-Out</td>
              <td style="padding: 8px 0; color: #111827; text-align: right;">${new Date(data.checkOut).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Guests</td>
              <td style="padding: 8px 0; color: #111827; text-align: right;">${data.guests} Persons</td>
            </tr>
            <tr style="border-top: 1px solid #e5e7eb;">
              <td style="padding: 15px 0 0; color: #111827; font-weight: bold;">Total Amount</td>
              <td style="padding: 15px 0 0; color: #1e3a8a; font-weight: bold; font-size: 18px; text-align: right;">${data.amount} ETB</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/my-bookings" style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">View My Bookings</a>
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p>© ${new Date().getFullYear()} EthioCampGround. All rights reserved.</p>
      </div>
    </div>
  `,

  /**
   * Account Status Notification (Ban/Warning/Unban)
   */
  statusNotification: (data) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 12px; overflow: hidden; border: 1px solid ${data.type === 'active' ? '#bbf7d0' : '#fecaca'};">
      <div style="background-color: ${data.type === 'ban' ? '#dc2626' : data.type === 'warning' ? '#f59e0b' : '#059669'}; padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">${data.type === 'active' ? 'Account Restored' : 'Security Notification'}</h1>
      </div>
      <div style="padding: 40px 30px;">
        <h2 style="color: #1f2937; margin-top: 0;">Hello <strong>${data.userName}</strong>,</h2>
        <p style="color: #4b5563; line-height: 1.6;">
          ${data.type === 'active' 
            ? 'We are pleased to inform you that your account access has been fully restored.' 
            : `This is an official notification regarding your account status on EthioCampGround. ${data.type === 'ban' ? 'Your account has been restricted' : 'You have received a formal warning'}.`}
        </p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid ${data.type === 'ban' ? '#dc2626' : data.type === 'warning' ? '#f59e0b' : '#059669'}; padding: 15px; margin: 25px 0;">
          <p style="margin: 0; color: #1f2937; font-weight: bold;">Note/Reason:</p>
          <p style="margin: 5px 0 0; color: #4b5563;">${data.reason}</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #1f2937; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Go to Dashboard</a>
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p>This is an automated system message. Please do not reply to this email.</p>
      </div>
    </div>
  `,

  /**
   * OTP Verification Template
   */
  otpVerification: (data) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background-color: #1e293b; padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px;">ETHIOCAMPGROUND</h1>
      </div>
      <div style="padding: 40px 30px; text-align: center;">
        <h2 style="color: #0f172a; margin-top: 0;">Verify Your Email</h2>
        <p style="color: #64748b; line-height: 1.6;">Use the following code to complete your verification process. This code will expire in 10 minutes.</p>
        
        <div style="margin: 30px 0;">
          <span style="font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2563eb; background-color: #eff6ff; padding: 15px 30px; border-radius: 8px; border: 2px dashed #bfdbfe;">${data.otp}</span>
        </div>

        <p style="color: #94a3b8; font-size: 14px;">If you didn't request this, please ignore this email or contact security.</p>
      </div>
      <div style="background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
        <p>© ${new Date().getFullYear()} EthioCampGround Security Team</p>
      </div>
    </div>
  `,

  /**
   * Welcome Email Template
   */
  welcomeEmail: (data) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=300&q=80'); background-size: cover; padding: 60px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 32px;">Welcome to the Wild!</h1>
        <p style="font-size: 18px; margin-top: 10px;">Your EthioCampGround adventure starts here.</p>
      </div>
      <div style="padding: 40px 30px;">
        <h2 style="color: #1f2937; margin-top: 0;">Hello ${data.userName},</h2>
        <p style="color: #4b5563; line-height: 1.6;">We're thrilled to have you join our community of explorers. Whether you're looking for a quiet mountain retreat or a lakeside adventure, we have the perfect spot for you.</p>
        
        <div style="margin: 30px 0;">
          <h3 style="color: #111827; font-size: 18px;">Next Steps:</h3>
          <ul style="color: #4b5563; line-height: 2;">
            <li>Complete your profile</li>
            <li>Explore available campsites</li>
            <li>Make your first reservation</li>
          </ul>
        </div>

        <div style="text-align: center; margin-top: 40px;">
          <a href="${process.env.FRONTEND_URL}/camps" style="background-color: #059669; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Start Exploring</a>
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p>© ${new Date().getFullYear()} EthioCampGround Team</p>
      </div>
    </div>
  `,

  /**
   * Booking Status Update (Accepted/Rejected)
   */
  bookingStatusUpdate: (data) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background-color: ${data.status === 'Accepted' ? '#059669' : '#dc2626'}; padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">Booking ${data.status}</h1>
      </div>
      <div style="padding: 40px 30px;">
        <h2 style="color: #1f2937; margin-top: 0;">Hello ${data.guestName},</h2>
        <p style="color: #4b5563; line-height: 1.6;">Your booking for <strong>${data.campName}</strong> has been <strong>${data.status.toLowerCase()}</strong> by the camp manager.</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid ${data.status === 'Accepted' ? '#059669' : '#dc2626'}; padding: 15px; margin: 25px 0;">
          <p style="margin: 0; color: #1f2937;"><strong>Reservation Code:</strong> ${data.reservationCode}</p>
          <p style="margin: 5px 0 0; color: #4b5563;"><strong>Dates:</strong> ${new Date(data.checkIn).toLocaleDateString()} - ${new Date(data.checkOut).toLocaleDateString()}</p>
        </div>

        ${data.status === 'Accepted' 
          ? `<p style="color: #4b5563; line-height: 1.6;">We look forward to seeing you! Please ensure you have your reservation code ready upon arrival.</p>`
          : `<p style="color: #4b5563; line-height: 1.6;">Please contact support if you have any questions.</p>`
        }
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/my-bookings" style="background-color: #1e293b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">View Booking Details</a>
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p>© ${new Date().getFullYear()} EthioCampGround Management</p>
      </div>
    </div>
  `,

  /**
   * Booking Cancellation (By User)
   */
  bookingCancellation: (data) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background-color: #64748b; padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">Booking Cancelled</h1>
      </div>
      <div style="padding: 40px 30px;">
        <h2 style="color: #1f2937; margin-top: 0;">Hello ${data.guestName},</h2>
        <p style="color: #4b5563; line-height: 1.6;">This email confirms that your booking for <strong>${data.campName}</strong> (Code: ${data.reservationCode}) has been successfully cancelled.</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #64748b; padding: 15px; margin: 25px 0;">
          <p style="margin: 0; color: #4b5563;">We hope to see you again soon for another adventure!</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/camps" style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Find Another Camp</a>
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p>© ${new Date().getFullYear()} EthioCampGround Team</p>
      </div>
    </div>
  `,

  /**
   * Camp Status Update (Approval/Rejection)
   */
  campStatusNotification: (data) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background-color: ${data.status === 'active' ? '#059669' : '#dc2626'}; padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">Camp Status Update</h1>
      </div>
      <div style="padding: 40px 30px;">
        <h2 style="color: #1f2937; margin-top: 0;">Hello ${data.managerName},</h2>
        <p style="color: #4b5563; line-height: 1.6;">We have reviewed your camp application for <strong>${data.campName}</strong>.</p>
        
        <div style="background-color: ${data.status === 'active' ? '#ecfdf5' : '#fef2f2'}; border-left: 4px solid ${data.status === 'active' ? '#059669' : '#dc2626'}; padding: 15px; margin: 25px 0;">
          <p style="margin: 0; color: ${data.status === 'active' ? '#065f46' : '#991b1b'}; font-weight: bold;">Status: ${data.status === 'active' ? 'APPROVED' : 'REJECTED'}</p>
          ${data.reason ? `<p style="margin: 5px 0 0; color: ${data.status === 'active' ? '#065f46' : '#991b1b'};">${data.reason}</p>` : ''}
        </div>

        ${data.status === 'active' 
          ? `<p style="color: #4b5563; line-height: 1.6;">Congratulations! Your camp is now live on the EthioCampGround platform. You can now manage bookings and update your camp details from your manager dashboard.</p>`
          : `<p style="color: #4b5563; line-height: 1.6;">Unfortunately, we could not approve your camp at this time. Please address the issues mentioned above and resubmit your application.</p>`
        }
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/manager-dashboard?welcome=true" style="background-color: #1e293b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Go to Manager Dashboard</a>
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p>© ${new Date().getFullYear()} EthioCampGround Management Team</p>
      </div>
    </div>
  `,

  /**
   * System Announcement / Alert Template
   */
  systemAnnouncement: (data) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">System Announcement</h1>
        <p style="margin: 5px 0 0; opacity: 0.8;">Important Update from EthioCampGround</p>
      </div>
      <div style="padding: 40px 30px;">
        <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">${data.title}</h2>
        <div style="color: #334155; line-height: 1.8; font-size: 16px;">
          ${data.message.split('\n').map(line => `<p style="margin-bottom: 15px;">${line}</p>`).join('')}
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center;">
          <a href="${process.env.FRONTEND_URL}" style="color: #2563eb; font-weight: 600; text-decoration: none;">Visit Our Website</a>
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p>You are receiving this because you have an account on EthioCampGround.</p>
        <p>© ${new Date().getFullYear()} EthioCampGround. All rights reserved.</p>
      </div>
    </div>
  `
};

module.exports = emailTemplates;
