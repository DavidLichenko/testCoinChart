export function openSupportChat() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event("support-chat:open"));
}

export function closeSupportChat() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event("support-chat:close"));
}