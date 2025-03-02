<script>
    import logo from '$lib/assets/logo.svg';
    import {onMount} from 'svelte';
    import {writable} from "svelte/store";
    import {getAuthToken} from "$lib/js/auth.js";
    import {getUserData, getProfilePic, displayUserCardHandler} from "$lib/js/user.js";
    import {
        newAssignmentData,
        addAssignment,
        toggleAssignmentDetails,
        getAssignments,
        formatSelectedDueDate,
        updateAssignment,
        updateAssignmentsSorting,
        deleteAssignment
    } from '$lib/js/home/assignments.js';
    import {
        getCurrentDate,
        getMonthData,
        getFormattedCurrentDate,
        goBackMonth,
        goForwardMonth,
        getMonthsForNextYears,
        handleDateClick,
        getFullDate,
        handleNewEventClick,
        addEvent,
        getDateEvents,
        deleteEvent
    } from "$lib/js/home/calendar.js";

    const authToken = getAuthToken();

    let profilePicture = '';

    let username = '';
    let email = '';

    let displayUserCard = false;

    onMount(async () => {
        selectedMonth = monthSelectOptions[0];

        currentDateDisplay = getFormattedCurrentDate();
        let monthData = getMonthData(selectedMonth);
        dates = monthData.dates;
        emptyDates = monthData.emptyDates;

        let userData = await getUserData(authToken);
        username = userData.username;
        email = userData.email;

        profilePicture = await getProfilePic(authToken);
        assignments.set(await getAssignments(authToken, sortType));
    });

    // Error handling
    let timeout;
    let error = '';
    function showErrorMsg(err) {
        if (err) {
            error = err;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                error = '';
            }, 5000);
        }
    }

    // Runes
    $: sortType, assignments.set(updateAssignmentsSorting($assignments, sortType));
    $: newAssignmentData.dueDate, formatSelectedDueDate();
    $: if (addAssignment && addAssignmentBtn) addAssignmentBtn.focus();
    $: if (!isAddingAssignment) getAssignmentsHelper(authToken);

    $: selectedMonth, updateCalendarHelper();

    let assignments = writable([]);

    let expandedAssignment = null;

    let addAssignmentBtn;
    let isAddingAssignment = false;

    let sortType = "subject";
    const subjectColors = {
        "math": "#4A90E2",
        "science": "#50E3C2",
        "german": "#D0021B",
        "history": "#8B3513",
        "geography": "#008C8C",
        "politics": "#9B4F96",
        "english": "#F8E71C",
        "pe": "#F8E71C",
        "art": "#FF33CC",
        "music": "#FFD700",
        "computer_sience": "#50B7F5",
        "religion": "#9B7DFF",
        "eac": "#636363",
        "other": "#D3D3D3"
    };

    let calendar;
    let selectedMonth = '';

    let dates = [];
    let emptyDates = [];
    let currentDateDisplay = '';

    const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const monthSelectOptions = getMonthsForNextYears();
    const monthLookup = {
        jan: 'January',
        feb: 'February',
        mar: 'March',
        apr: 'April',
        may: 'May',
        jun: 'June',
        jul: 'July',
        aug: 'August',
        sep: 'September',
        oct: 'October',
        nov: 'November',
        dec: 'December'
    };

    let clickedDate = null;
    let bottomOfCalendar = null;
    let calendarWidth;
    let eventList;
    let events;
    let eventIsEditing = false;
    let newEventName;

    /**
     * Handles the expansion of an assignment's details on click.
     *
     * @param {number} index The index of the assignment in the assignments array.
     * @param {Event} e The event that triggered this function.
     *
     * @returns {void}
     */
    function handleExpandClick(index, e) {
        e.stopPropagation();
        expandedAssignment = toggleAssignmentDetails(expandedAssignment, index, e);
    }

    /**
     * Updates an assignment in the database, then fetches the assignments list
     * and updates the assignments store if the update was successful.
     *
     * @param {string} authToken The authentication token to use for the request.
     * @param {assignment} assignment The assignment to update.
     *
     * @returns {Promise<void>}
     */
    async function updateAssignmentHelper(authToken, assignment) {
        const success = await updateAssignment(authToken, assignment);
        if (success) {
            await getAssignmentsHelper(authToken);
        }
    }

    /**
     * Fetches the assignments list from the server and updates the assignments
     * store with the new data.
     *
     * @param {string} authToken The authentication token to use for the request.
     *
     * @returns {Promise<void>}
     */
    async function getAssignmentsHelper(authToken) {
        const newAssignmnents = await getAssignments(authToken);
        assignments.set(newAssignmnents);
    }

    /**
     * Deletes an assignment from the database and updates the assignments list if the
     * deletion was successful.
     *
     * @param {string} authToken The authentication token to use for the request.
     * @param {number} index The index of the assignment to delete in the assignments
     *     array.
     * @param {assignment[]} assignments The array of assignments from which to delete
     *     the assignment.
     *
     * @returns {Promise<void>}
     */
    async function deleteAssignmentHelper(authToken, index, assignments) {
        const success = await deleteAssignment(authToken, index, assignments);
        if (success) {
            await getAssignmentsHelper(authToken);
        }
    }

    /**
     * Updates the `dates` and `emptyDates` variables by calling `getMonthData` with
     * the current `selectedMonth`.
     *
     * @returns {void}
     */
    function updateCalendarHelper() {
        let monthData = getMonthData(selectedMonth);
        dates = monthData.dates;
        emptyDates = monthData.emptyDates;
    }

    /**
     * Handles a click event on the calendar.
     *
     * If the clicked date is not the same as the previously clicked date, the
     * function calls `handleDateClick` and, if the response indicates that the
     * date selection should be opened, it updates the `bottomOfCalendar`, `events`,
     * and `clickedDate` variables. Additionally, it updates the CSS style of the
     * calendar by setting the `border-top-right-radius` and `border-top-left-radius`
     * properties to '0px'.
     *
     * If the clicked date is the same as the previously clicked date, the function
     * sets the `events` and `clickedDate` variables to null and resets the CSS
     * style of the calendar by setting the `border-top-right-radius` and
     * `border-top-left-radius` properties to '6px'.
     *
     * @param {number} date - The day of the month.
     * @param {Event} event - The click event object.
     *
     * @returns {Promise<void>}
     */
    async function dateClickHelper(date, event) {
        const dateClick = await handleDateClick(date, clickedDate, calendar, event, authToken, selectedMonth);
        if (dateClick.action === "open") {
            bottomOfCalendar = dateClick.bottomOfCalendar;
            events = dateClick.events;
            clickedDate = dateClick.clickedDate;
            calendarWidth = dateClick.width;

            events !== [] ? updateTopEventClass() : null;

            calendar.style.borderTopRightRadius = '0px';
            calendar.style.borderTopLeftRadius = '0px';
        } else {
            events = null;
            clickedDate = null;
            calendar.style.borderTopRightRadius = '6px';
            calendar.style.borderTopLeftRadius = '6px';
        }
    }

    /**
     * Updates the `top-event` class of the elements in the `eventList` so that
     * only the first element has the class.
     *
     * @returns {void}
     */
    const updateTopEventClass = () => {
        if (eventList?.children.length > 0) {
            Array.from(eventList.children).forEach((child) =>
                child.classList.remove('top-event')
            );

            eventList.children[0].classList.add('top-event');
        }
    };

    /**
     * Resets the calendar's CSS style and sets the `clickedDate` variable to null.
     *
     * @returns {void}
     */
    function closeEventModalHandler() {
        clickedDate = null;
        calendar.style.borderTopRightRadius = '6px';
        calendar.style.borderTopLeftRadius = '6px';
    }

    /**
     * Handles the submission of a new event.
     *
     * If the event list is empty, it adds the 'top-event' class to the "Add Event"
     * button. It then sends a request to add the event to the server. If the
     * request is successful, it updates the `events` variable and calls
     * `updateTopEventClass` to update the `top-event` class of the elements in the
     * event list. It also resets the `newEventName` and `eventIsEditing` variables.
     *
     * @param {Event} event - The event that triggered the function.
     * @param {string} authToken - The authentication token for the API request.
     *
     * @returns {Promise<void>}
     */
    async function addEventHelper(event, authToken) {
        eventList?.childElementCount === 1 ? document.querySelector('.add-event').classList.add('top-event') : '';
        const success = await addEvent(event, newEventName, clickedDate, selectedMonth, authToken);
        if (success) {
            events = await getDateEvents(clickedDate, authToken, selectedMonth);
            events !== [] ? updateTopEventClass() : null;
            newEventName = '';
            eventIsEditing = false;
        }

        // TODO: Implement error handling
    }

    /**
     * Toggles the display of event information on hover.
     *
     * This function changes the text and styling of a span element within the
     * event button. When hovering, it displays 'delete' with a 'material-symbols-rounded'
     * class. When not hovering, it reverts to the event's name and removes the class.
     *
     * @param {Event} e - The DOM event object containing the current target element.
     * @param {Object} eventData - The event data object containing event details.
     * @param {boolean} isHovering - A flag indicating whether the event is being hovered.
     *
     * @returns {void}
     */
    function handleEventHover(e, eventData, isHovering) {
        const spanElement = e.currentTarget.querySelector('span');

        if (isHovering) {
            spanElement.textContent = 'delete';
            spanElement.classList.add('material-symbols-rounded');
        } else {
            spanElement.textContent = eventData.name;
            spanElement.classList.remove('material-symbols-rounded');
        }
    }

    /**
     * Handles the deletion of an event.
     *
     * If the deletion is successful, this function updates the list of events and
     * updates the CSS class of the first event button to have 'top-event'.
     *
     * @param {Object} event - The event object containing the name of the event to delete.
     * @param {string} authToken - The authentication token for the API request.
     *
     * @returns {Promise<void>}
     */
    async function deleteEventHelper(event, authToken) {
        const success = await deleteEvent(event, clickedDate, selectedMonth, authToken);
        if (success) {
            events = await getDateEvents(clickedDate, authToken, selectedMonth);
            console.log(events);
            events.length !== 0 ? updateTopEventClass() : document.querySelector('.add-event').classList.add('top-event');;
        }
    }
</script>

<div class="body">
    <div class="nav-bar">
        <div class="logo">
            <img src={logo} alt="logo" class="logo-img"/>
            <h1 class="logo-name">SCHOLARTHYNK</h1>
        </div>
        <div class="button-group-nav">
            <a href="/notes" class="nav">Notes</a>
            <!-- svelte-ignore a11y_img_redundant_alt -->
            <button class="profile-pic" on:click={() => {displayUserCard = displayUserCardHandler(displayUserCard)}}>
                <img src={profilePicture}
                     alt="Your Profile Picture"
                     class="profile-pic-img"/></button>
        </div>
    </div>
    <div class="dashboard-content">
        <div class="recent-notes" style="grid-area: box-1">
            <h1 class="section-title">Recent Notes</h1>
            <div class="notes-list">
                <div class="notes-list-item">
                    <p class="note-title">Study Tips for Final Exams</p>
                    <p>02.01.2025</p>
                </div>
            </div>
            <div class="button-wrapper">
                <button class="button view-all-notes">View All</button>
                <button class="button add-note"><span class="material-symbols-rounded">add_notes</span>
                    <p>New Note</p></button>
            </div>
        </div>
        <div class="calendar" id="calendar" bind:this={calendar} style="grid-area: box-2">
            <div class="calendar-header">
                <h1>{currentDateDisplay}</h1>
            </div>
            <div class="month-selector">
                <select id="month-select" class="month-dropdown" bind:value={selectedMonth}>
                    {#each monthSelectOptions as monthOption}
                        {@const [month, year] = monthOption.split('-')}
                        <option value={monthOption}>{monthLookup[month.toLowerCase()] || 'Invalid month'} {year}</option>
                    {/each}
                </select>
                <div class="month-select-manual-wrapper">
                    <button class="month-select-btn month-select-back" on:click={() => {selectedMonth = goBackMonth(selectedMonth)}}><span
                            class="material-symbols-rounded">arrow_back_ios</span></button>
                    <button class="month-select-btn month-select-forward" on:click={() => {selectedMonth = goForwardMonth(selectedMonth)}}><span
                            class="material-symbols-rounded">arrow_forward_ios</span></button>
                </div>
            </div>
            <div class="calendar-body" id="calendar-body">
                {#each daysOfWeek as day}
                    <p class="calendar-body-day">{day}</p>
                {/each}

                <!-- Empty slots for alignment -->
                {#each emptyDates as _}
                    <div class="calendar-body-day-empty"></div>
                {/each}

                <!-- Dates of the month -->
                {#each dates as date}
                    <button class="calendar-body-date {date === getCurrentDate().getDate() && getCurrentDate().getMonth() === new Date(selectedMonth).getMonth() && getCurrentDate().getFullYear() === new Date(selectedMonth).getFullYear() ? 'current-date' : ''} {clickedDate === date && getCurrentDate().getMonth() === new Date(selectedMonth).getMonth() && getCurrentDate().getFullYear() === new Date(selectedMonth).getFullYear() ? 'selected-date' : ''}"
                            on:click={(event) => dateClickHelper(date, event)}>{date}</button>
                {/each}
            </div>
        </div>
        <div class="assignments" style="grid-area: box-3">
            <h1 class="section-title">Assignments</h1>
            <div class="sort-options-wrapper">
                <h2>Filter by</h2>
                <select id="assignment-sort-select" class="assignment-sort-select" bind:value={sortType}>
                    <option value="subject">Subject</option>
                    <option value="status">Status</option>
                    <option value="priority">Priority</option>
                    <option value="date">Date</option>
                </select>
            </div>
            <div class="assignments-wrapper">
                <div class="assignments-list">
                    {#each $assignments as assignment, index (assignment.title)}
                        <button class="assignment {expandedAssignment === index ? 'expanded' : ''}"
                                style="border: 1px solid {subjectColors[assignment.subject.toLowerCase()]}"
                                on:click={(e) => {handleExpandClick(index, e)}}>
                            <div class="assignment-base-info">
                                <p class="assignment-title">{assignment.title}</p>
                                <div class="right-assignment">
                                    <span class="material-symbols-rounded priority {assignment.priority === "lowest" || assignment.priority == "low" ? "low" : assignment.priority == "medium" ? "medium" : assignment.priority == "high" || assignment.priority == "highest" ? "high" : ""}">{assignment.priority === "lowest" ? "keyboard_double_arrow_down" : assignment.priority === "low" ? "keyboard_arrow_down" : assignment.priority === "medium" ? "equal" : assignment.priority === "high" ? "keyboard_arrow_up" : "keyboard_double_arrow_up"}</span>
                                    <h3 class="due-date">{assignment.dueDate}</h3>
                                </div>
                            </div>
                            {#if expandedAssignment === index}
                                <div class="assignment-details-wrapper">
                                    <div class="assignment-details">
                                        <div class="assignment-details-info">
                                            <select id="assignment-status" class="assignment-select"
                                                    bind:value={assignment.status}
                                                    on:change={() => {updateAssignmentHelper(authToken, assignment)}}>
                                                <option value="open">Open</option>
                                                <option value="inProgress">In Progress</option>
                                                <option value="done">Done</option>
                                            </select>
                                            <select id="assignment-priority" class="assignment-select priority-select"
                                                    bind:value={assignment.priority}
                                                    on:change={() => {updateAssignmentHelper(authToken, assignment)}}>
                                                <option value="lowest">Lowest</option>
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="highest">Highest</option>
                                            </select>
                                        </div>
                                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                                        <span class="material-symbols-rounded delete"
                                              on:click={(e) => {deleteAssignmentHelper(authToken, index, $assignments)}}>delete</span>
                                    </div>
                                    <textarea id="assignment-description" class="assignment-description"
                                              placeholder="Description..." bind:value={assignment.description}
                                              on:blur={() => {updateAssignmentHelper(authToken, assignment)}}></textarea>
                                </div>
                            {/if}
                        </button>
                    {/each}
                    {#if isAddingAssignment}
                        <button class="assignment expanded" bind:this={addAssignmentBtn}
                                on:keydown={async (e) => {isAddingAssignment = await addAssignment(authToken, e)}}>
                            <div class="assignment-base-info">
                                <input class="assignment-title assignment-input" placeholder="Title..."
                                       bind:value={newAssignmentData.title}>
                                <div class="right-assignment">
                                    <input class="due-date assignment-input due-date-input" type="date"
                                           bind:value={newAssignmentData.dueDate}>
                                </div>
                            </div>
                            <div class="assignment-details-wrapper">
                                <div class="assignment-details">
                                    <div class="assignment-details-info">
                                        <select id="assignment-priority" class="assignment-select"
                                                bind:value={newAssignmentData.priority}>
                                            <option value="lowest">Lowest</option>
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="highest">Highest</option>
                                        </select>
                                        <select class="assignment-select subject-select"
                                                bind:value={newAssignmentData.subject}>
                                            <option value="math">Math</option>
                                            <option value="science">Science</option>
                                            <option value="german">German</option>
                                            <option value="english">English</option>
                                            <option value="history">History</option>
                                            <option value="geography">Geography</option>
                                            <option value="politics">Politics</option>
                                            <option value="pe">PE</option>
                                            <option value="art">Art</option>
                                            <option value="music">Music</option>
                                            <option value="computer_siecne">Computer Sience</option>
                                            <option value="religion">Religion</option>
                                            <option value="eac">EaC</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                                    <span class="material-symbols-rounded addAssignment" style="font-size: 2rem"
                                          on:click={async (e) => {isAddingAssignment = await addAssignment(authToken, e)}}>add</span>
                                </div>
                                <textarea id="assignment-description" class="assignment-description"
                                          placeholder="Description..."
                                          bind:value={newAssignmentData.description}></textarea>
                            </div>
                        </button>
                    {/if}
                </div>
                <button class="add-assignment" on:click={()=>{isAddingAssignment = true}}><span
                        class="material-symbols-rounded">add</span>
                    <h1>Add Assignment</h1></button>
            </div>
        </div>
        <div class="placeholderDashboard" style="grid-area: box-4">

        </div>
    </div>
</div>

{#if clickedDate}
    <div class="event-modal" style="bottom: calc({bottomOfCalendar}px - 2%); width: {calendarWidth}px">
        <div class="event-modal-header">
            <div>
                <h1>{clickedDate ? getFullDate(clickedDate, selectedMonth) : 'N/A'}</h1>
            </div>
            <button class="close-btn" on:click={closeEventModalHandler}><span
                    class="material-symbols-rounded">close</span></button>
        </div>
        <div class="event-list" bind:this={eventList}>
            {#each events as event}
                <!-- svelte-ignore a11y_mouse_events_have_key_events -->
                <button class="event top-event" on:mouseover={(e) =>  handleEventHover(e, event, true)}
                        on:mouseout={(e) => handleEventHover(e, event, false)} on:click={() => deleteEventHelper(event, authToken)}>
                    <span>{event.name}</span></button>
            {/each}
            {#if eventIsEditing}
                <input class="event new-event-input {eventList?.childElementCount === 1 ? 'top-event' : ''}" type="text"
                       bind:value={newEventName} on:keydown={() => addEventHelper(event, authToken)} on:blur={() => addEventHelper(event, authToken)} placeholder="Enter event name...">
            {/if}
            <button class="event add-event bottom-event {eventList?.childElementCount === 1 ? 'top-event' : ''}"
                    on:click={() => {newEventName = ''; eventIsEditing = true; handleNewEventClick()}}><span class="material-symbols-rounded">add</span>
                <p>New Event</p></button>
        </div>
    </div>
{/if}

{#if displayUserCard}
    <div class="user-card">
        <div class="upper-section"></div>
        <!-- svelte-ignore a11y_img_redundant_alt -->
        <img src={profilePicture} alt="Your Profile Picture" class="card-profile-pic">
        <div class="card-user-data">
            <h2>{username}</h2>
            <p>{email}</p>
        </div>
        <div class="card-fabs">
            <button class="card-fab">
                <span class="material-symbols-rounded">group</span>
            </button>
            <button class="card-fab">
                <span class="material-symbols-rounded">settings</span>
            </button>
            <button class="card-fab">
                <span class="material-symbols-rounded">logout</span>
            </button>
        </div>
        <div class="card-btns">
            <button class="card-btn dark-light-toggle"><span class="material-symbols-rounded">contrast</span>
                <p>Dark/Light Mode</p></button>
            <button class="card-btn switch-account"><span class="material-symbols-rounded">switch_account</span>
                <p>Switch Account</p></button>
        </div>
    </div>
{/if}

{#if error}
    <div class="error-wrapper">
        <h1 class="error">{error}</h1>
    </div>
{/if}

<style>
    @import "$lib/style/global.css";
    @import "$lib/style/home.css";
</style>