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
    "God is a fuck face asshole, but you're not 🪄🐭",

    // Wayne's world
    `Did you ever see The Twilight Zone where the guy signed a contract, 
     and they cut out his tongue, and they put it in a jar, and it wouldn't die?
     It just grew and pulsated and gave birth to baby tongues.
     Pretty cool, huh? I gotta go. 👅🫙`,
    "In France, you would be called La Renarde, and would be hunted, with only your cunning to protect you. 🏹🎯🦌",
    "You're a babe. You're a robo-babe.🤖💅",
    "If you were a president, you'd be Babe-raham Lincoln. 🎩🧔🏻‍♂️🇺🇸",   
    `Did you ever find Bugs Bunny attractive when he'd put 
     on a dress and play a girl bunny?
     Neither did I. I was just asking.🐰👗`, 
    "You're double live gonzo, intensity in ten cities, live at Budokan.⛩️🏯",
    `Where did you learn English?
     College, and the Police Academy movies.🎥👮`,
    "你很漂亮 ('you look pretty', in Cantonese).🪭🇨🇳",
    `Will you still love me when I'm in my carbohydrate, 
     sequined jump-suit, young-girls-in-white-cotton-panties, 
     waking-up-in-a-pool-of-your-own-vomit, bloated, purple, 
     dead-on-a-toilet phase? 🍔🍟🥤🍩🍕 💎✨👗 😰😱 🩲👙 🤮🥴🍺 💀👻💜 🚽🪦`,
    `Oh, actually, all champagne is French. It's named after the region. 
     Otherwise, it's sparkling white wine. 
     Americans, of course, don't recognize the convention, so it becomes that thing of calling all of their sparkling whites champagne, even though by definition they're not.🍾🥂`, 
    "One, two, three, four five, six, seven, eight Schlemiel, schlimazel Hasen Pfeffer Incorporated!📺🥰",
    "How exactly does the suck-cut work? Well, as you can see, it sucks as it cuts! 💇‍♂️✂️", 
    
    // Pure Affirmations
    "You are enough. You've always been enough. 💕",
    "I'm so proud of you for being here 🥹",
    "You deserve good things pwincess 🎁💖",
    "The world is better with you in it 🌍✨",
    "You're doing better than you think diva 💪💕"
  ];

  getRandomAffirmation(): { message: string; duration: number } {
    const index = Math.floor(Math.random() * this.affirmations.length);
    const message = this.affirmations[index];

    // Base duration of 2.5s + ~50ms per character, capped between 2.5s and 10s
    const baseDuration = 2500;
    const perCharDuration = 50;
    const calculatedDuration = baseDuration + (message.length * perCharDuration);
    const duration = Math.min(Math.max(calculatedDuration, 2500), 10000);

    return { message, duration };
  }
}
