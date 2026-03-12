export async function solveMathProblem(problem: string) {
  const response = await fetch("/api/solve", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ problem }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to solve problem");
  }

  const data = await response.json();
  return data.text;
}
