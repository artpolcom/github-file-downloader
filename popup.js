// Element references
let statusSwitchButton = null;
let proceedButton = null;
let cancelButton = null;
let dialogueWindow = null;

// Default extension status
const defaultStatus = "enableInjection";

// Setting new value and appearance of status button
function setPreferenceValueInUI(value) {
    statusSwitchButton.setAttribute("data-status", value);

    // Figuring out button text and class name
    const extensionStatus = value === "enableInjection" ? "Active" : "Disabled";
    const statusClassName = `status-${extensionStatus.toLowerCase()}`;

    statusSwitchButton.innerText = extensionStatus;
    statusSwitchButton.className = statusClassName;
}

// Updating preference in storage and modifying 'Confirm' button data
function updatePreference(e) {
    const actionToConfirm = e.target.getAttribute("data-new-action");

    // Saving preference to persistent storage
    chrome.storage.sync.set({ scriptInjectionStatus: actionToConfirm });
    
    setPreferenceValueInUI(actionToConfirm);
    addActionToConfirmationButton(actionToConfirm);
    closeDialogueBox();

    // Reload tab for new settings to take effect
    chrome.tabs.reload();
}

// Adds opposite action to data-* attribute of confirmation button 
function addActionToConfirmationButton(oldAction) {
    // 'Proceed' button's data-* attribute stores future extension status  
    const newAction = oldAction === defaultStatus ? "disableInjection" : defaultStatus;
    proceedButton.setAttribute("data-new-action", newAction);
}

// Closing dialogue box (with a nice animation in place!)
function closeDialogueBox() {
    dialogueWindow.classList.remove("show");
    setTimeout(() => {
        dialogueWindow.style.display = "none";
    }, 360);
}

// Showing dialogue box
function openDialogueBox(e) {
    // Getting current extension status from data-* attribute of status button
    const status = e.target.getAttribute("data-status");

    const actionNameElement = document.getElementById("preference-dialogue-bold-text");
    // Deriving opposite action from current status
    actionNameElement.innerText = status === "enableInjection" ? "disable" : "enable";
    
    dialogueWindow.style.display = "flex";
    setTimeout(() => {
        dialogueWindow.classList.add("show");
    }, 200)
}

document.addEventListener('DOMContentLoaded', () => {
    // Button for showing preference update dialogue 
    statusSwitchButton = document.getElementById("status-switch-button");
    // Button for confirming preference update
    proceedButton = document.getElementById("confirm");
    // Button for canceling preference update
    cancelButton = document.getElementById("cancel");
    // Dialogue for updating preference
    dialogueWindow = document.querySelector(".overlay");

    // Load saved preference to set initial UI state
    chrome.storage.sync.get(['scriptInjectionStatus'], (result) => {
        const currentStatus = result.scriptInjectionStatus || defaultStatus;
        setPreferenceValueInUI(currentStatus);
        addActionToConfirmationButton(currentStatus);
    });

    statusSwitchButton.addEventListener("click", openDialogueBox);
    cancelButton.addEventListener("click", closeDialogueBox);
    proceedButton.addEventListener("click", updatePreference);
});