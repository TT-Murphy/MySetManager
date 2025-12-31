// Core swim set parsing and formatting logic
import {
  ParsedSwimSet,
  SwimSet,
  Exercise,
  Rest,
  Comment,
} from "../types/swimSet";

export function parseSwimSet(input: string): ParsedSwimSet {
  if (!input || typeof input !== "string") {
    return {
      sets: [],
      totalYardage: 0,
      estimatedTime: 0,
      difficulty: 0,
      comments: [],
    };
  }

  const lines = input.split("\n").map((line) => line.trim());
  const result: ParsedSwimSet = {
    sets: [],
    totalYardage: 0,
    estimatedTime: 0,
    difficulty: 0,
    comments: [],
  };

  let currentSet: SwimSet | null = null;
  let setMultiplier = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for empty line - this ends the current set
    if (line === "") {
      if (currentSet && currentSet.exercises.length > 0) {
        result.sets.push(currentSet);
        currentSet = null;
        setMultiplier = 1;
      }
      continue;
    }

    if (isSetMultiplier(line)) {
      // Handle set multipliers like "3x" or "2 rounds"
      if (currentSet && currentSet.exercises.length > 0) {
        result.sets.push(currentSet);
      }
      setMultiplier = parseMultiplier(line);
      currentSet = {
        multiplier: setMultiplier,
        exercises: [],
        yardage: 0,
        estimatedTime: 0,
      };
    } else if (isExercise(line)) {
      // Handle individual exercises
      const exercise = parseExercise(line);
      if (currentSet) {
        currentSet.exercises.push(exercise);
        currentSet.yardage += exercise.totalYardage;
        currentSet.estimatedTime += exercise.estimatedTime;
      } else {
        // Create a new set if none exists
        currentSet = {
          multiplier: 1,
          exercises: [exercise],
          yardage: exercise.totalYardage,
          estimatedTime: exercise.estimatedTime,
        };
      }
    } else if (isRest(line)) {
      // Handle rest periods
      const rest = parseRest(line);
      if (currentSet) {
        currentSet.exercises.push(rest);
        currentSet.estimatedTime += rest.duration;
      } else {
        // Create a new set for standalone rest
        currentSet = {
          multiplier: 1,
          exercises: [rest],
          yardage: 0,
          estimatedTime: rest.duration,
        };
      }
    } else {
      // Handle comments inline
      const comment: Comment = {
        type: "comment",
        text: line,
      };

      if (currentSet) {
        currentSet.exercises.push(comment);
      } else {
        // Create a new set for standalone comments
        currentSet = {
          multiplier: 1,
          exercises: [comment],
          yardage: 0,
          estimatedTime: 0,
        };
      }
    }
  }

  // Add the last set if it exists
  if (currentSet && currentSet.exercises.length > 0) {
    result.sets.push(currentSet);
  }

  // Calculate totals
  for (const set of result.sets) {
    result.totalYardage += set.yardage * set.multiplier;
    result.estimatedTime += set.estimatedTime * set.multiplier;
  }

  // Calculate difficulty rating
  result.difficulty = calculateDifficulty(result, input);

  return result;
}

function isSetMultiplier(line: string): boolean {
  const multiplierPatterns = [
    /^\d+x\s*$/i, // "3x"
    /^\d+\s*(rounds?|sets?)\s*$/i, // "2 rounds" or "3 sets"
  ];
  return multiplierPatterns.some((pattern) => pattern.test(line));
}

function parseMultiplier(line: string): number {
  const match = line.match(/^(\d+)/);
  return match ? parseInt(match[1]) : 1;
}

function isExercise(line: string): boolean {
  // Check if line contains distance and stroke pattern
  const exercisePatterns = [
    /\d+x?\s*\d+\s*(fr|free|freestyle|back|backstroke|breast|breaststroke|fly|butterfly|im|individual\s*medley|drill|kick)/i,
    /\d+\s*x\s*\d+/i, // Basic "4x50" pattern
  ];
  return exercisePatterns.some((pattern) => pattern.test(line));
}

function parseExercise(line: string): Exercise {
  // Extract repetitions, distance, stroke, pace, and other details
  let reps = 1;
  let distance = 50;

  // Check if this is a repetition pattern (e.g., "4x50", "4 x 50", "4x50s") vs single distance (e.g., "200")
  const repsWithXMatch = line.match(/^(\d+)\s*x\s*(\d+)s?/i); // "4x50" or "4 x 50" or "4x50s"
  const singleDistanceMatch = line.match(/^(\d+)s?\s+[a-z]/i); // "200 Free" or "200s Free" - distance followed by letter

  if (repsWithXMatch) {
    // This is a repetition pattern like "4x50"
    reps = parseInt(repsWithXMatch[1]);
    distance = parseInt(repsWithXMatch[2]);
  } else if (singleDistanceMatch) {
    // This is a single distance like "200 Free easy"
    reps = 1;
    distance = parseInt(singleDistanceMatch[1]);
  } else {
    // Fallback to original logic for edge cases
    const repsMatch = line.match(/^(\d+)\s*x/i);
    const distanceMatch =
      line.match(/x?\s*(\d+)\s/i) || line.match(/\s(\d+)\s/);
    reps = repsMatch ? parseInt(repsMatch[1]) : 1;
    distance = distanceMatch ? parseInt(distanceMatch[1]) : 50;
  }

  const intervalMatch =
    line.match(/(@|on\s+)?(\d+):(\d+)/i) || // "@1:30" or "on 1:30" or "1:30"
    line.match(/(\d+):(\d+)/i) || // "1:30"
    line.match(/on\s+(\d+)\s+minutes?/i) || // "on 1 minute" or "on 2 minutes"
    line.match(/on\s+(\d+)\s*:\s*(\d+)/i); // "on 1:00"
  const paceMatch = line.match(/(fast|easy|moderate|build|desc|descend)/i);

  const pace = paceMatch ? paceMatch[1] : "";

  // Enhanced stroke parsing with specifications
  const { stroke, specifications } = parseStrokeWithSpecifications(line);

  let interval = 0;
  if (intervalMatch) {
    if (intervalMatch[0].includes("minute")) {
      // Handle "on X minute" format
      const minutes = parseInt(intervalMatch[1]);
      interval = minutes * 60;
    } else {
      // Handle "X:XX" format
      const minutes = parseInt(intervalMatch[2] || intervalMatch[1]);
      const seconds = parseInt(intervalMatch[3] || intervalMatch[2] || "0");
      interval = minutes * 60 + seconds;
    }
  }

  return {
    type: "exercise",
    reps,
    distance,
    stroke,
    specifications,
    pace,
    interval,
    totalYardage: reps * distance,
    estimatedTime:
      interval > 0
        ? reps * interval
        : estimateSwimTime(reps, distance, stroke, pace),
    originalText: line,
  };
}

function parseStrokeWithSpecifications(line: string): {
  stroke: string;
  specifications?: string;
} {
  // Primary stroke types that should be the main clause
  const primaryStrokes = [
    "free",
    "freestyle",
    "fr",
    "back",
    "backstroke",
    "bk",
    "breast",
    "breaststroke",
    "br",
    "fly",
    "butterfly",
    "bf",
    "im",
    "individual medley",
    "choice",
    "stroke",
    "nf",
    "nonfree",
    "non-free",
    "free-im",
    "freeim",
  ];

  // Remove intervals, numbers at start, and pace words to focus on stroke content
  let cleanLine = line
    .toLowerCase()
    .replace(/^\d+\s*x?\s*\d+s?\s*/g, "") // Remove leading numbers like "30x50" or "4x50s"
    .replace(/\d+:\d+/g, "") // Remove time intervals
    .replace(/@|\bon\b/gi, "") // Remove interval indicators
    .replace(/\b(fast|easy|moderate|build|desc|descend)\b/gi, "") // Remove pace words
    .replace(/\bon\s+\d+\s+minutes?\b/gi, "") // Remove "on X minute(s)"
    .trim();

  // Find primary stroke in the cleaned line
  const primaryStrokeMatch = primaryStrokes.find((stroke) => {
    const regex = new RegExp(`\\b${stroke}\\b`, "i");
    return regex.test(cleanLine);
  });

  let stroke: string;
  let specs: string | undefined;

  if (primaryStrokeMatch) {
    stroke = normalizeStroke(primaryStrokeMatch);

    // Extract everything that's not the primary stroke as specifications
    const specText = cleanLine
      .replace(new RegExp(`\\b${primaryStrokeMatch}\\b`, "gi"), "")
      .replace(/\s+/g, " ")
      .trim();

    if (specText) {
      specs = specText;
    }
  } else {
    // No primary stroke found, treat everything as the main stroke
    if (cleanLine) {
      stroke = cleanLine
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    } else {
      stroke = "Free"; // Fallback
    }
  }

  return { stroke, specifications: specs };
}

function isRest(line: string): boolean {
  const restPatterns = [
    /rest/i,
    /\d+\s*(min|minutes?|sec|seconds?)\s*(rest|break)?/i,
    /^\d+:\d+\s*(rest|break)?/i,
  ];
  return restPatterns.some((pattern) => pattern.test(line));
}

function parseRest(line: string): Rest {
  const timeMatch =
    line.match(/(\d+):(\d+)/) || line.match(/(\d+)\s*(min|minutes?)/i);
  let duration = 0;

  if (timeMatch) {
    if (line.includes(":")) {
      duration = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
    } else {
      duration = parseInt(timeMatch[1]) * 60;
    }
  } else {
    // Default rest time if not specified
    duration = 60;
  }

  return {
    type: "rest",
    duration,
    originalText: line,
  };
}

function normalizeStroke(stroke: string): string {
  const strokeMap: { [key: string]: string } = {
    fr: "Free",
    free: "Free",
    freestyle: "Free",
    back: "Back",
    backstroke: "Back",
    breast: "Breast",
    breaststroke: "Breast",
    fly: "Fly",
    butterfly: "Fly",
    im: "IM",
    "individual medley": "IM",
    drill: "Drill",
    kick: "Kick",
    choice: "Choice",
  };
  return strokeMap[stroke.toLowerCase()] || stroke;
}

function estimateSwimTime(
  reps: number,
  distance: number,
  stroke: string,
  pace: string
): number {
  // Base time per 100 yards in seconds (rough estimates)
  const baseTimes: { [key: string]: number } = {
    Free: 75,
    Back: 85,
    Breast: 95,
    Fly: 90,
    IM: 90,
    Drill: 120,
    Kick: 150,
  };

  let baseTime = baseTimes[stroke] || baseTimes["Free"];

  // Adjust for pace
  const paceMultipliers: { [key: string]: number } = {
    fast: 0.85,
    moderate: 1.0,
    easy: 1.15,
    build: 1.0,
    desc: 1.0,
    descend: 1.0,
  };

  const multiplier = paceMultipliers[pace.toLowerCase()] || 1.0;
  const timePerRep = (distance / 100) * baseTime * multiplier;

  return reps * timePerRep + (reps - 1) * 10; // Add 10 seconds between reps
}

export function formatSwimSet(parsedSet: ParsedSwimSet): string {
  let output = "";
  let cumulativeDistance = 0;

  // Format each set
  for (let setIndex = 0; setIndex < parsedSet.sets.length; setIndex++) {
    const set = parsedSet.sets[setIndex];

    if (set.multiplier > 1) {
      output += `${set.multiplier}x\n`;
    }

    for (const item of set.exercises) {
      if (item.type === "comment") {
        // Handle inline comments
        const commentLine =
          set.multiplier > 1 ? `\t${item.text}\n` : `${item.text}\n`;
        output += commentLine;
      } else if (item.type === "rest") {
        const restTime = formatTime(item.duration);
        output +=
          set.multiplier > 1 ? `\tRest ${restTime}\n` : `Rest ${restTime}\n`;
      } else {
        // Handle exercises with specifications
        const interval =
          item.interval > 0 ? ` ${formatTime(item.interval)}` : "";
        const pace = item.pace ? ` ${item.pace}` : "";
        const strokeWithSpecs = item.specifications
          ? `${item.stroke} (${item.specifications})`
          : item.stroke;

        // Format exercise line - only show reps if > 1
        const exerciseLine =
          item.reps > 1
            ? `${item.reps} x ${item.distance} ${strokeWithSpecs}${pace}${interval}`
            : `${item.distance} ${strokeWithSpecs}${pace}${interval}`;

        output +=
          set.multiplier > 1 ? `\t${exerciseLine}\n` : `${exerciseLine}\n`;
      }
    }

    // Add cumulative distance after each set (except the last one)
    cumulativeDistance += set.yardage * set.multiplier;
    if (setIndex < parsedSet.sets.length - 1) {
      const cumulativeLine = `${cumulativeDistance} yards`;
      // Use a much larger width to ensure right alignment (190 characters)
      const padding = Math.max(0, 190 - cumulativeLine.length);
      output += `\n${" ".repeat(padding)}${cumulativeLine}\n\n`;
    } else {
      output += "\n";
    }
  }

  return output.trim();
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }
}

export function calculateTotalYardage(parsedSet: ParsedSwimSet): number {
  return parsedSet.totalYardage;
}

export function calculateEstimatedTime(parsedSet: ParsedSwimSet): number {
  return parsedSet.estimatedTime;
}

/**
 * Calculate difficulty rating on a 0-100 scale
 * Factors: yardage (primary), intervals, intensity keywords
 * Target: 100 = extremely hard practice (10k yards + lots of fast work)
 */
function calculateDifficulty(
  parsedSet: ParsedSwimSet,
  originalText: string
): number {
  let difficulty = 0;

  // Base difficulty from yardage (0-60 points)
  // 10,000 yards = 60 points, scales linearly
  const yardageScore = Math.min(60, (parsedSet.totalYardage / 10000) * 60);
  difficulty += yardageScore;

  // Interval difficulty bonus (0-25 points)
  const intervalScore = calculateIntervalDifficulty(parsedSet);
  difficulty += intervalScore;

  // Intensity keyword bonus (0-15 points)
  const intensityScore = calculateIntensityBonus(originalText);
  difficulty += intensityScore;

  // Cap at 100 and round
  return Math.min(100, Math.round(difficulty));
}

/**
 * Analyze intervals for difficulty bonus
 * Fast intervals relative to stroke/distance = more difficulty
 */
function calculateIntervalDifficulty(parsedSet: ParsedSwimSet): number {
  let totalIntervalDifficulty = 0;
  let totalYardageWithIntervals = 0;

  for (const set of parsedSet.sets) {
    for (const item of set.exercises) {
      if (item.type === "exercise" && item.interval > 0) {
        const intervalDifficulty = getIntervalDifficultyScore(
          item.distance,
          item.stroke,
          item.interval
        );

        // Weight by yardage of this exercise
        const exerciseYardage = item.totalYardage * set.multiplier;
        totalIntervalDifficulty += intervalDifficulty * exerciseYardage;
        totalYardageWithIntervals += exerciseYardage;
      }
    }
  }

  if (totalYardageWithIntervals === 0) return 0;

  // Average difficulty weighted by yardage, scaled to 0-25
  const avgDifficulty = totalIntervalDifficulty / totalYardageWithIntervals;
  return Math.min(25, avgDifficulty * 25);
}

/**
 * Score individual interval difficulty
 * Returns 0-1 where 1 = very challenging interval
 */
function getIntervalDifficultyScore(
  distance: number,
  stroke: string,
  interval: number
): number {
  // Define "moderate" intervals (not easy, not crushing)
  const moderateIntervals: { [key: string]: { [distance: number]: number } } = {
    Free: { 25: 25, 50: 50, 100: 75, 200: 160, 400: 340, 500: 430 },
    Back: { 25: 30, 50: 60, 100: 90, 200: 190, 400: 400 },
    Breast: { 25: 35, 50: 70, 100: 110, 200: 230, 400: 480 },
    Fly: { 25: 30, 50: 65, 100: 100, 200: 220, 400: 460 },
    IM: { 100: 100, 200: 220, 400: 460 },
  };

  // Normalize stroke name
  const normalizedStroke =
    stroke === "Free"
      ? "Free"
      : stroke === "Back"
      ? "Back"
      : stroke === "Breast"
      ? "Breast"
      : stroke === "Fly"
      ? "Fly"
      : stroke === "IM"
      ? "IM"
      : "Free";

  const moderateTime = moderateIntervals[normalizedStroke]?.[distance];
  if (!moderateTime) return 0; // Unknown distance/stroke combo

  // Calculate ratio: lower interval = higher difficulty
  const ratio = moderateTime / interval;

  // Convert to 0-1 scale where:
  // ratio > 1.5 = very hard (score near 1)
  // ratio = 1.0 = moderate (score = 0.5)
  // ratio < 0.8 = easy (score near 0)
  if (ratio >= 1.5) return 1.0;
  if (ratio <= 0.8) return 0.0;
  return (ratio - 0.8) / 0.7; // Linear scale between 0.8 and 1.5
}

/**
 * Analyze text for intensity keywords and phrases
 * Returns 0-15 bonus points
 */
function calculateIntensityBonus(text: string): number {
  const lowercaseText = text.toLowerCase();
  let bonus = 0;

  // High intensity keywords (3 points each, max 3 occurrences = 9 points)
  const highIntensityWords = [
    "sprint",
    "fast",
    "afap",
    "all.{0,5}out",
    "race.{0,5}pace",
    "max",
    "explosive",
  ];
  let highIntensityCount = 0;

  for (const word of highIntensityWords) {
    const regex = new RegExp(word, "gi");
    const matches = (lowercaseText.match(regex) || []).length;
    highIntensityCount = Math.min(3, highIntensityCount + matches);
  }
  bonus += highIntensityCount * 3;

  // Medium intensity keywords (1.5 points each, max 2 occurrences = 3 points)
  const mediumIntensityWords = [
    "pace",
    "tempo",
    "threshold",
    "build",
    "neg.{0,5}split",
    "descend",
  ];
  let mediumIntensityCount = 0;

  for (const word of mediumIntensityWords) {
    const regex = new RegExp(word, "gi");
    const matches = (lowercaseText.match(regex) || []).length;
    mediumIntensityCount = Math.min(2, mediumIntensityCount + matches);
  }
  bonus += mediumIntensityCount * 1.5;

  // Challenging sets/formats (2 points each, max 1.5 occurrences = 3 points)
  const challengingFormats = [
    "ladder",
    "pyramid",
    "broken",
    "negative.{0,5}split",
    "time.{0,5}trial",
  ];
  let formatCount = 0;

  for (const format of challengingFormats) {
    const regex = new RegExp(format, "gi");
    const matches = (lowercaseText.match(regex) || []).length;
    formatCount = Math.min(1, formatCount + (matches > 0 ? 1 : 0));
  }
  bonus += formatCount * 3;

  return Math.min(15, bonus);
}
