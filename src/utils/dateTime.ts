export function getVietnamTime(): string {
    const now = new Date();
    
    // Chuyển đổi sang múi giờ Việt Nam (UTC+7)
    const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    
    return vietnamTime.toISOString();
}

// Hoặc dùng hàm này nếu muốn format đẹp hơn
export function getFormattedVietnamTime(): string {
    const now = new Date();
    
    // Chuyển đổi sang múi giờ Việt Nam
    return now.toLocaleString('vi-VN', { 
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
} 