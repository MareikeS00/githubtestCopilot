document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper to safely escape HTML in participant names
  function escapeHtml(str) {
    if (typeof str !== "string") return "";
    return str
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

        // Build participants HTML (show badges or empty state)
        let participantsHTML;
        if (details.participants && details.participants.length > 0) {
          participantsHTML = `
            <div class="participants-section">
              <h5>Participants (${details.participants.length})</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (p) =>
                      `<li data-email="${escapeHtml(p)}">
                        <span class="participant-badge">${escapeHtml(p)}</span>
                        <button class="participant-delete" title="Unregister">&times;</button>
                      </li>`
                  )
                  .join("")}
              </ul>
            </div>
          `;
        } else {
          participantsHTML = `
            <div class="participants-section">
              <h5>Participants (0)</h5>
              <p class="no-participants">No participants yet</p>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

          // Attach delete handlers for participant buttons
          const deleteButtons = activityCard.querySelectorAll('.participant-delete');
          deleteButtons.forEach((btn) => {
            btn.addEventListener('click', async (e) => {
              e.preventDefault();
              const li = btn.closest('li');
              const email = li && li.getAttribute('data-email');
              if (!email) return;

              if (!confirm(`Unregister ${email} from ${name}?`)) return;

              try {
                const res = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(email)}`,
                  { method: 'DELETE' }
                );

                const result = await res.json();
                if (res.ok) {
                  // Remove the list item from DOM
                  li.remove();

                  // Update the participants count header
                  const header = activityCard.querySelector('.participants-section h5');
                  const currentCount = activityCard.querySelectorAll('.participants-list li').length;
                  if (header) header.textContent = `Participants (${currentCount})`;
                } else {
                  alert(result.detail || 'Failed to unregister participant');
                }
              } catch (err) {
                console.error('Error unregistering participant:', err);
                alert('Failed to unregister participant. Please try again.');
              }
            });
          });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
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
        // Re-fetch activities so the UI updates immediately
        await fetchActivities();
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
