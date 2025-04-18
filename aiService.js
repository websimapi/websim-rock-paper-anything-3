// AI Interaction Functions
async function evaluateObjects(newObject, currentObj) {
  try {
    showResult('', true);
    
    const completion = await websim.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are the judge in a creative game called "Rock Paper Anything" where players suggest objects that can beat other objects.
          Your task is to evaluate if the new object can logically beat the current object.
          Be generous in allowing logical relationships - if there's any reasonable way the new object could beat the current one, allow it.
          Consider real world physics, properties, and creative logical relationships.
          Think broadly about how objects could interact, considering size, strength, abilities, and natural properties.
          Be very lenient and creative in your judgments - the goal is to keep the game fun by accepting reasonable connections.
          Only reject completely illogical or nonsensical relationships.`
        },
        {
          role: "user",
          content: `Evaluate if "${newObject}" can logically beat "${currentObj}".
          Provide your answer in JSON format with the following fields:
          - valid: boolean indicating if the new object can beat the current one
          - explanation: detailed explanation of why it works or doesn't work
          - suggestedEmoji: an appropriate emoji representation for the new object (if text was entered)`
        }
      ],
      json: true
    });
    
    return JSON.parse(completion.content);
  } catch (error) {
    console.error("Error evaluating objects:", error);
    return { valid: false, explanation: "An error occurred during evaluation. Please try again." };
  }
}

async function getObjectRelationships(obj1, obj2) {
  try {
    const completion = await websim.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are the judge in a creative game called "Rock Paper Anything" where objects compete against each other.
          Your task is to determine which object would win in a conflict between the two objects and explain why.
          Be generous and creative in considering logical relationships - if there's a reasonable way one could beat the other, allow it.
          Think creatively about how objects could interact, considering all possible properties and relationships.
          Be lenient with your judgments - the goal is to make the game fun and interesting.`
        },
        {
          role: "user",
          content: `Analyze the relationship between "${obj1}" and "${obj2}".
          Determine which object would win in a conflict and explain why.
          Provide your answer in JSON format with the following fields:
          - winner: the object that would win
          - loser: the object that would lose
          - explanation: detailed explanation of why the winner beats the loser`
        }
      ],
      json: true
    });
    
    return JSON.parse(completion.content);
  } catch (error) {
    console.error("Error getting relationship:", error);
    return null;
  }
}