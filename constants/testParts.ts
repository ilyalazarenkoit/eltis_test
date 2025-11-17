export type Part = {
  id: number;
  title: string;
  description: string;
  questionIds: number[];
  passageText?: string;
};

export const LISTENING_PARTS: Part[] = [
  {
    id: 1,
    title: "PART 1",
    description:
      "In this part of the test, you will look at a picture and hear a teacher give three different directions to students in a class. Choose the directions—A, B, or C—that the students in the picture have followed.",
    questionIds: [1, 2],
  },
  {
    id: 2,
    title: "PART 2",
    description:
      "In this part of the test, you will hear several math word problems. You will hear each word problem two times. After you hear each word problem, look at the three expressions and choose the one that matches the word problem you heard.",
    questionIds: [3, 4],
  },
  {
    id: 3,
    title: "PART 3",
    description:
      "In this part of the test, you will hear short conversations between two people. You will hear each conversation two times. Read the question and listen to the conversation. Then answer the question.",
    questionIds: [5],
  },
  {
    id: 4,
    title: "PART 4",
    description:
      "In this part of the test, you will hear conversations between a teacher and a student in a class. After you hear each conversation, you will answer some questions about what you heard. Read the questions and listen to the conversation. Then answer the questions.",
    questionIds: [6, 7, 8],
  },
  {
    id: 5,
    title: "PART 5",
    description:
      "In this part of the test, you will hear a teacher talking to a class. After you hear each passage, you will answer some questions about what you heard.",
    questionIds: [9, 10, 11],
  },
];

export const READING_PARTS: Part[] = [
  {
    id: 1,
    title: "PART 1",
    description:
      "In this part of the test, you will read some sentences and choose the best answer to complete each sentence. Read the sentence in the sample. Then choose the best answer that completes the sentence.",
    questionIds: [12, 13, 14, 15],
  },
  {
    id: 2,
    title: "PART 2",
    description:
      "In this part of the test, you will read some sentences and choose the best answer to complete each sentence.",
    questionIds: [16, 17, 18, 19],
  },
  {
    id: 3,
    title: "PART 3",
    description:
      "In this part of the test, you will read and answer questions about some passages.",
    questionIds: [20, 21, 22, 23, 24],
    passageText:
      "The First Amendment of the United States Constitution guarantees citizens the right to petition their government. This means that people have the right to try to influence the actions that the government takes. Groups of people usually have more influence than people working alone, so many Americans belong to at least one organized group, such as a labor union, large business, religious group, league, or club. Often, these organized groups seek to influence the way Congress votes on particular issues. When these organized groups petition Congress, they are referred to as special interest groups.\n\nSpecial interest groups hire representatives to speak to members of Congress. In the past, these representatives would meet with legislators in the lobby of the building. For this reason, they are known today as lobbyists. Lobbyists work with local, state, and federal politicians. In the past, lobbyists have influenced decisions made by Congress on major issues such as slavery, women's suffrage, and taxes.\n\nThere are two kinds of lobbying: coalition and grassroots. Coalition lobbying occurs when two or more special interest groups join together for a similar cause. Grassroots lobbying is when a special interest group encourages citizens to voice their opinions to Congress though phone calls, e-mail, letters, and other forms of communication supporting the group's interests. When it comes to lobbying Congress, there is power in numbers.\n\nLobbying is not the same as bribery. It is illegal to buy a legislator's vote. On the other hand, many special interest groups may contribute money to the individual campaigns of legislators in order to win their support. In order to maintain checks and balances among lobbyists and special interest groups, Congress has passed two acts. In 1946, Congress passed the Regulation of Lobbying Act, requiring all professional lobbyists to register their employers and their expenses. Congress passed another act in 1995, the Lobbying Disclosure Act, that requires lobbyists to file more thorough reports dealing with the nature of their lobbying.",
  },
];

export function getPartForQuestion(
  questionId: number,
  type: "listening" | "reading"
): Part | null {
  const parts = type === "listening" ? LISTENING_PARTS : READING_PARTS;
  return parts.find((part) => part.questionIds.includes(questionId)) || null;
}
