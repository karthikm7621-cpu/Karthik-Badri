document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("data-form");
    const jsonInput = document.getElementById("json-input");
    const submitBtn = document.getElementById("submit-btn");
    const btnText = submitBtn.querySelector(".btn-text");
    const spinner = submitBtn.querySelector(".spinner");
    const feedbackMessage = document.getElementById("feedback-message");
    const resultOutput = document.getElementById("result-output");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Reset UI state
        feedbackMessage.textContent = "";
        feedbackMessage.className = "feedback";
        resultOutput.classList.add("empty-state");
        
        let payload;
        try {
            // Validate JSON on client side before sending
            const rawValue = jsonInput.value.trim();
            if (!rawValue) throw new Error("Input cannot be empty.");
            payload = JSON.parse(rawValue);
        } catch (error) {
            showFeedback(`Invalid JSON: ${error.message}`, "error");
            return;
        }

        // Set Loading state
        setLoading(true);

        try {
            // Asynchronously trigger Flask API
            const response = await fetch("/api/process", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "An error occurred during processing.");
            }

            // Update DOM dynamically with result
            resultOutput.classList.remove("empty-state");
            resultOutput.textContent = JSON.stringify(data, null, 2);
            showFeedback("Data processed successfully!", "success");

        } catch (error) {
            resultOutput.textContent = "Processing failed.";
            showFeedback(error.message, "error");
        } finally {
            // Remove Loading state
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            btnText.classList.add("hidden");
            spinner.classList.remove("hidden");
        } else {
            submitBtn.disabled = false;
            btnText.classList.remove("hidden");
            spinner.classList.add("hidden");
        }
    }

    function showFeedback(message, type) {
        feedbackMessage.textContent = message;
        feedbackMessage.className = `feedback ${type}`;
    }
});
