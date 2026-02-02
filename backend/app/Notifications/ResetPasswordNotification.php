<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{
    use Queueable;

    public $token;

    /**
     * Create a new notification instance.
     */
    public function __construct($token)
    {
        $this->token = $token;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $url = config('app.frontend_url') . '/reset-password?token=' . $this->token . '&email=' . urlencode($notifiable->email);

        return (new MailMessage)
            ->subject('รีเซ็ตรหัสผ่าน - CompetManager')
            ->greeting('สวัสดี ' . $notifiable->name)
            ->line('คุณได้รับอีเมลนี้เพราะเราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ')
            ->action('รีเซ็ตรหัสผ่าน', $url)
            ->line('ลิงก์นี้จะหมดอายุใน 24 ชั่วโมง')
            ->line('หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน ไม่จำเป็นต้องดำเนินการใดๆ')
            ->salutation('ขอแสดงความนับถือ, ทีมงาน CompetManager');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
