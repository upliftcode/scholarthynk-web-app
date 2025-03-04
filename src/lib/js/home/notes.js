import {logout} from "$lib/js/auth.js";

let newNotification = null;

/**
 * Sets the callback function for the new notification system.
 *
 * The callback function should accept 3 parameters: type, title, and message.
 * The type parameter should be one of "error", "warning", or "info".
 * The title and message parameters are the title and message of the notification to be displayed.
 *
 * If called with a falsy value, the callback function will not be changed.
 *
 * @param {Function} callback - The callback function to be called when a new notification is to be displayed.
 */
export function newNotificationTN(callback) {
    if (callback) {
        newNotification = callback;
    }
}

export async function getRecentNotes(authToken) {
    if (authToken) {
        const response = await fetch('http://127.0.0.1:3000/api/get-notes', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 200) {
            const data = await response.json();

            return data.notes.sort((a, b) => new Date(b.lastEdited) - new Date(a.lastEdited)).slice(0, 6);
        } else if (response.status === 401) {
            newNotification("error", "Unauthorized", await response.json().error);
            setTimeout(() => {logout();}, 5000);
            return {};
        } else if (response.status === 500) {
            newNotification("error", "Error while loading notes", await response.json().error);
            return {};
        } else {
            newNotification("error", "Unable to load notes", "There was an unexpected error. Please try again!");
            return {};
        }
    } else {
        newNotification("error", "Unauthorized", "You are not authorized!");
        setTimeout(() => {logout();}, 5000);
        return {};
    }
}