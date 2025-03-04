import {logout} from "$lib/js/auth.js";

let newNotification = null;

export function newNotificationTFV(callback) {
    if (callback) {
        newNotification = callback;
    }
}

/**
 * Fetches the items in the file viewer.
 * @param {string} folder the name of the folder to fetch items from
 * @param {string[]} path the path to the parent folder
 * @param {string} authToken the authentication token
 * @returns {Promise<{folders: string[], files: string[]}>} an object containing the folders and files in the folder
 */
export async function getFVItems(folder, path, authToken) {
    if (authToken) {
        const response = await fetch('http://127.0.0.1:3000/api/get-fv-items', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({folder: folder, path: path})
        });

        if (response.status === 200) {
            const data = await response.json();

            if (data.folders.length === 0 && data.files.length === 0) {
                newNotification("warning", "No items found", "There are no items in this folder.");
            }

            return {folders: data.folders, files: data.files};
        } else if (response.status === 401) {
            newNotification("error", "Unauthorized", await response.json().error);
            setTimeout(() => {logout();}, 5000);
            return false;
        } else if (response.status === 500) {
            newNotification("error", "Error while loading items", await response.json().error);
            return {folders: [], files: []};
        } else {
            newNotification("error", "Unable to load items", "There was an unexpected error. Please try again!");
            return {folders: [], files: []};
        }
    }
}

/**
 * Delete a folder in the file viewer.
 * @param {string} selectedItemName the name of the folder to be deleted
 * @param {string[]} path the path to the parent folder
 * @param {string} authToken the authentication token
 * @returns {Promise<boolean>} `true` if the folder was deleted successfully, `false` otherwise
 */
export async function deleteFolder(selectedItemName, path, authToken) {
    if (authToken) {
        const response = await fetch('http://127.0.0.1:3000/api/delete-fv-items', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({folder: selectedItemName, path: path})
        });

        if (response.status === 200) {
            return true;
        } else if (response.status === 400) {
            newNotification("error", "Invalid item", await response.json().error);
            return false;
        } else if (response.status === 404) {
            newNotification("error", "Error while deleting item", await response.json().error);
            return false;
        } else if (response.status === 401) {
            newNotification("error", "Unauthorized", await response.json().error);
            setTimeout(() => {logout();}, 5000);
            return false;
        } else if (response.status === 500) {
            newNotification("error", "Error while deleting item", await response.json().error);
            return false;
        } else {
            newNotification("error", "Unable to delete item", "There was an unexpected error. Please try again!");
            return false;
        }
    }
}

/**
 * Create a new folder in the file viewer.
 * @param {string} newFolderName the name of the new folder
 * @param {string[]} path the path to the parent folder
 * @param {string} authToken the authentication token
 * @returns {Promise<boolean>} `true` if the folder was created successfully, `false` otherwise
 */
export async function createFolder(newFolderName, path, authToken) {
    if (authToken) {
        const response = await fetch('http://127.0.0.1:3000/api/create-folder', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({folder: path, name: newFolderName})
        });

        if (response.status === 200) {
            return true;
        } else if (response.status === 400) {
            newNotification("error", "Error while creating new folder", await response.json().error);
            return false;
        } else if (response.status === 409) {
            newNotification("error", "Error while creating new folder", await response.json().error);
            return false;
        } else if (response.status === 401) {
            newNotification("error", "Unauthorized", await response.json().error);
            setTimeout(() => {logout();}, 5000);
            return false;
        } else if (response.status === 500) {
            newNotification("error", "Error while creating new folder", await response.json().error);
            return false;
        } else {
            newNotification("error", "Unable to create new folder", "There was an unexpected error. Please try again!");
            return false;
        }
    }
}

/**
 * Create a new note in the file viewer.
 * @param {string[]} path the path to the parent folder
 * @param {string} authToken the authentication token
 * @returns {Promise<boolean>} `true` if the creation was successful, `false` otherwise
 */
export async function createNote(path, authToken) {
    if (authToken) {
        const response = await fetch('http://127.0.0.1:3000/api/new-note', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({path: path})
        });

        if (response.status === 200) {
            return true;
        } else if (response.status === 400) {
            newNotification("error", "Error while creating new note", await response.json().error);
            return false;
        } else if (response.status === 401) {
            newNotification("error", "Unauthorized", await response.json().error);
            setTimeout(() => {logout();}, 5000);
            return false;
        } else if (response.status === 500) {
            newNotification("error", "Error while creating new note", await response.json().error);
            return false;
        } else {
            newNotification("error", "Unable to create new note", "There was an unexpected error. Please try again!");
            return false;
        }
    }
}

/**
 * Rename a file or folder in the file viewer.
 * @param {string} newItemName the new name of the item
 * @param {string} selectedItem the name of the item to be renamed
 * @param {string[]} path the path to the parent folder
 * @param {string} authToken the authentication token
 * @returns {Promise<boolean>} `true` if the rename was successful, `false` otherwise
 */
export async function renameFVItem(newItemName, selectedItem, path, authToken) {
    if (authToken) {
        if (newItemName === "") {
            newNotification("error", "Invalid name", "New name cannot be empty!");
            return false;
        }

        if (newItemName === selectedItem) {
            newNotification("error", "Invalid name", "New name cannot be the same as the old name.");
            return false;
        }

        const response = await fetch('http://127.0.0.1:3000/api/rename-fv-item', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({path: path, oldName: selectedItem, newName: newItemName})
        });

        if (response.status === 200) {
            const index = path.indexOf(selectedItem);
            if (index !== -1) {
                path.splice(index, 1);
            }

            return true;
        } else if (response.status === 400) {
            newNotification("error", "Invalid name", await response.json().error);
            return false;
        } else if (response.status === 404) {
            newNotification("error", "Item not found", await response.json().error);
            return false;
        } else if (response.status === 401) {
            newNotification("error", "Unauthorized", await response.json().error);
            setTimeout(() => {logout();}, 5000);
            return false;
        } else if (response.status === 500) {
            newNotification("error", "Error while renaming item", await response.json().error);
            return false;
        } else {
            newNotification("error", "Unable to rename item", "There was an unexpected error. Please try again!");
            return false;
        }
    }
}