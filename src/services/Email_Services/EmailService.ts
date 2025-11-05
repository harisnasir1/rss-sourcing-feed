import nodemailer from 'nodemailer';

class Email_Service{
    private transpoter;
    private from;
    private subject;
    private text;
    constructor()
    {
            this.transpoter= nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASSWORD,
           },
           });
           this.from=process.env.EMAIL_USER;
           this.subject="ai source feeding Forget password"
           this.text="this is your link"
    }
    // Generate HTML email template
  private generateResetEmailHTML(userName: string, link: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #007bff;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Password Reset Request</h1>
          
          <p>Hi ${userName},</p>
          
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          
          <center>
            <a href="${link}" class="button">Reset Password</a>
          </center>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <p>This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.</p>
          </div>
          
          
          
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} AI Source Feeding. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }


   public async sendmail(to:string, link:string,userName:string)
    { 
        const mailOptions = {
      from: `"AI Source Feeding" <${this.from}>`,
      to: to,
      subject: 'Password Reset Request',
      html: this.generateResetEmailHTML(userName, link), // Use HTML instead of text
    };
        
         this.transpoter.sendMail(mailOptions,function(error,info){
            if(error)
            {
                console.error("Email error :",error)
            }
            else{
                console.log("email sent:",info.response)
            }
         })
     
    }
    public async verifyConnection(): Promise<boolean> {
    try {
      await this.transpoter.verify();
      console.log('✅ Email service is ready');
      return true;
    } catch (error) {
      console.error('❌ Email service error:', error);
      return false;
    }
  }
}
export const email_service=new Email_Service()