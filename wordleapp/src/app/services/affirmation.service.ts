import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AffirmationService {
  private affirmations: string[] = [
    // Cute & Sweet (with affectation)
    "You're doing great diva! 💅",
    "AH! You're an angel! 👼✨",
    "You're wonderful pwincess 👑",
    "Did you fall from heaven? 😇",
    "You're literally so pwecious 🥺💕",
    "Ur doing amazing sweetie 💖",
    "Such a good little bean 🫘✨",
    "You're valid and loved bb 🥹",
    "Main character energy fr fr 💫",
    "Slay queen slay 👸💅",
    "You're the moment pwincess 💖",
    "Iconic behavior tbh 🌟",
    "Living legend status 🏆",
    "Certified cutie patootie 🎀",
    "You're giving what needs to be gave 💁‍♀️",
    "Mother is mothering 👑",
    "Ate and left no crumbs bestie 🍽️✨",
    "The blueprint tbh 📐💕",
    "You're a wittle star 🌟",
    "Sowwy but you're perfect 🥺",

    // Absurdist Humor
    "Why did the chicken cross the road? Because you were there and it loves you 🐔💕",
    "There is no god, but you exist, so that's good enough 🙏✨",
    "Scientists confirm: you're that bitch 🔬💅",
    "Breaking news: local angel too cute, more at 11 📺👼",
    "The sun rises every day just to see you slay 🌅💖",
    "Doctors hate this one weird trick: being you 👩‍⚕️✨",
    "Plot twist: you've been amazing this whole time 🎬",
    "Fun fact: mirrors are lucky to reflect you 🪞💕",
    "The moon asked about you btw 🌙",
    "Your vibe passed the vibe check unanimously 📋✅",
    "Even gravity can't bring you down queen 🍎👑",
    "NASA called, they found a star. It's you babe ⭐",
    "The alphabet soup spelled out 'ur perfect' 🍜",
    "A butterfly told me you're beautiful and butterflies never lie 🦋",
    "Your aura just cured my depression thanks 🌈",

    // Wholesome with Edge
    "Wow you're so beautiful and wonderful! 😍",
    "Life is meaningless but ur smile isn't 🖤✨",
    "In this economy?? And you're still thriving??? 📈💕",
    "Normalize being as cute as you 📢🥰",
    "You're the reason I believe in something 💫",
    "Existing is hard but you make it look easy 🌸",
    "The void stared back and said 'cute' 🕳️💖",
    "Chaos reigns but so do you bestie 👑🔥",
    "Touch grass? You ARE the grass. The moment. Everything. 🌱✨",
    "Mercury retrograde can't even touch you 🪐💅",

    // Pure Affirmations
    "You are enough. You've always been enough. 💕",
    "I'm so proud of you for being here 🥹",
    "You deserve good things pwincess 🎁💖",
    "The world is better with you in it 🌍✨",
    "You're doing better than you think diva 💪💕"
  ];

  getRandomAffirmation(): string {
    const index = Math.floor(Math.random() * this.affirmations.length);
    return this.affirmations[index];
  }
}
