// Placeholder controller logic.
// TODO: Replace dummy responses with real AI-driven logic.

export const startInterview = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Interview started (dummy response)",
    sessionId: "dummy-session-id-123",
  });
};

export const sendMessage = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Message received (dummy response)",
    reply: "This is a placeholder AI response.",
  });
};

export const endInterview = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Interview ended (dummy response)",
    summary: "This is a placeholder interview summary.",
  });
};
