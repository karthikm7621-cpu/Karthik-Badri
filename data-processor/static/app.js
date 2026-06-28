document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("data-form");
    const jsonInput = document.getElementById("json-input");
    const responseContainer = document.getElementById("response-container");
    const responseOutput = document.getElementById("response-output");
    const submitBtn = document.getElementById("submit-btn");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const rawData = jsonInput.value.trim();
        if (!rawData) {
            alert("Please enter some JSON data.");
            return;
        }

        let parsedData;
        try {
            parsedData = JSON.parse(rawData);
        } catch (err) {
            alert("Invalid JSON format. Please correct it and try again.");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Processing...";
        responseContainer.classList.add("hidden");

        try {
            const response = await fetch("/api/process", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(parsedData)
            });

            const responseData = await response.json();
            
            responseContainer.classList.remove("hidden");
            if (response.ok) {
                responseOutput.textContent = JSON.stringify(responseData, null, 2);
                responseOutput.style.color = "var(--text-main)";
            } else {
                responseOutput.textContent = `Error: ${responseData.error}`;
                responseOutput.style.color = "var(--error-color)";
            }
        } catch (error) {
            responseContainer.classList.remove("hidden");
            responseOutput.textContent = `Network Error: ${error.message}`;
            responseOutput.style.color = "var(--error-color)";
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Process Data";
        }
    });
});
