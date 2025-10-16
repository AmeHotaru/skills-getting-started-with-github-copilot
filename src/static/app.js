document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // helper to escape HTML in participant names
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section
        const participants = details.participants || [];
        let participantsHtml = "";
        if (participants.length > 0) {
          // We'll render list items with a delete button next to each participant
          participantsHtml =
            `<div class="participants">
              <h5 class="participants-heading">Participants</h5>
              <ul class="participants-list">` +
            participants
              .map(
                (p) =>
                  `<li class="participant-item">${escapeHtml(p)} <button class="unregister-btn" data-activity="${escapeHtml(
                    name
                  )}" data-email="${escapeHtml(p)}" title="Unregister">✖</button></li>`
              )
              .join("") +
            `</ul>
            </div>`;
        } else {
          participantsHtml = `<div class="participants info">No participants yet</div>`;
        }

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Attach event listeners for unregister buttons
      document.querySelectorAll(".unregister-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const activityName = e.currentTarget.getAttribute("data-activity");
          const email = e.currentTarget.getAttribute("data-email");

          if (!confirm(`Unregister ${email} from ${activityName}?`)) return;

          try {
            const resp = await fetch(
              `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
              { method: "DELETE" }
            );

            const result = await resp.json();
            if (resp.ok) {
              // Refresh activities list
              fetchActivities();
            } else {
              console.error("Failed to unregister:", result);
              alert(result.detail || "Failed to unregister participant");
            }
          } catch (err) {
            console.error("Error unregistering participant:", err);
            alert("Network error while unregistering participant");
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the new participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
