'use client';

import { useCallback } from 'react';
import { Box } from '@workspace/ui/components/ui/box';
import {
  TimelineTabContainer,
  TimelineTranscriptItemView,
  TimelineTableOfContents,
} from '@/domains/source-management/frontend/components/timeline-tab';
import { useBlockInteraction } from '@/domains/canvas-management/frontend/contexts/block-interaction-context';
import { useTutorialDialogContext } from '@/domains/tutorial-management/frontend/components/tutorial-dialog/core/context';
import { InteractionGuard } from '../../common/interaction-guard';

/**
 * Mock transcript for the tutorial.
 * 👉 Add or edit segments here. Each item: { text: string, start: number (seconds), duration: number (seconds) }.
 */
const MOCK_TRANSCRIPT = [
  {
    "text": "How do you get a new product off the ground? And when you're just starting out, where do those first real users actually come from? You see, most people aren't early adopters.",
    "start": 0.24,
    "duration": 11.68
  },
  {
    "text": "Ask yourself, how many products do you use today that you were among the first 10 users of? For most people, the answer is zero.",
    "start": 7.52,
    "duration": 10.48
  },
  {
    "text": "Almost no one wants to be a startup's first paying customer.",
    "start": 14.16,
    "duration": 7.599999999999998
  },
  {
    "text": "Yet, every great product still manages to find a few people willing to take that leap.",
    "start": 18,
    "duration": 7.519000000000002
  },
  {
    "text": "The earliest version of your product only needs to do one thing.",
    "start": 21.76,
    "duration": 8.239999999999998
  },
  {
    "text": "survive contact with a tiny group of people who might actually try it.",
    "start": 25.519,
    "duration": 7.761000000000003
  },
  {
    "text": "You're not building the final form.",
    "start": 30,
    "duration": 5.199999999999996
  },
  {
    "text": "You're building something that can evolve.",
    "start": 31.679,
    "duration": 5.601000000000003
  },
  {
    "text": "When you're starting out, you don't just need a minimum viable product.",
    "start": 33.28,
    "duration": 7.840000000000003
  },
  {
    "text": "You need a minimum evolvable product.",
    "start": 37.28,
    "duration": 7.400000000000006
  },
  {
    "text": "And I'm going to show you how to find one.",
    "start": 39.2,
    "duration": 5.479999999999997
  },
  {
    "text": "Before you get discouraged, there are people who love being early adopters.",
    "start": 46.719,
    "duration": 5.040999999999997
  },
  {
    "text": "One of my colleagues, Gustaf, worked at Airbnb for years and enjoyed trying out products from startups and bringing them into the company.",
    "start": 50.16,
    "duration": 8.239000000000004
  },
  {
    "text": "Others have such a burning issue that they're willing to give any new product a shot if it looks like it could make their life easier.",
    "start": 54.96,
    "duration": 8.079
  },
  {
    "text": "For example, when my team needed to ship our first inference API, we wanted to ship it fast and didn't want to deal with figuring out billing or public endpoint.",
    "start": 61.52,
    "duration": 9.839999999999996
  },
  {
    "text": "Within 3 days, I found and paid a startup whose product solved that issue for us.",
    "start": 67.6,
    "duration": 6.960000000000008
  },
  {
    "text": "I was their first customer.",
    "start": 71.36,
    "duration": 5.040000000000006
  },
  {
    "text": "Their size or reputation didn't matter.",
    "start": 72.799,
    "duration": 4.720999999999989
  },
  {
    "text": "Our problem did, so we took a chance on them, and they delivered.",
    "start": 74.56,
    "duration": 7.11999999999999
  },
  {
    "text": "The lesson is simple.",
    "start": 77.52,
    "duration": 4.159999999999997
  },
  {
    "text": "Finding your first users is more of a search problem than a persuasion problem.",
    "start": 77.52,
    "duration": 7.52000000000001
  },
  {
    "text": "You're looking for the Gustafs and Ankits of the world, the ones who try new things or have a burning need that you can solve.",
    "start": 83.52,
    "duration": 7.759999999999991
  },
  {
    "text": "This has a few counterintuitive implications that you're going to want to pay attention to.",
    "start": 88.32,
    "duration": 8.159000000000006
  },
  {
    "text": "Charge real money early.",
    "start": 92.24,
    "duration": 4.239000000000004
  },
  {
    "text": "Early adopters and people with a burning problem are rarely price sensitive.",
    "start": 92.24,
    "duration": 8.320000000000007
  },
  {
    "text": "The goal here isn't revenue, it's feedback, and paying customers give sharper feedback than free users ever will.",
    "start": 96.479,
    "duration": 9.200999999999993
  },
  {
    "text": "You're more likely to get feedback from an angry customer paying a lot of money than a nobody who isn't willing to pay.",
    "start": 104.159,
    "duration": 8
  },
  {
    "text": "Use targeted personal outreach.",
    "start": 109.439,
    "duration": 4.081000000000003
  },
  {
    "text": "The ways you find these people probably don't look like how you find normal people.",
    "start": 109.439,
    "duration": 7.76100000000001
  },
  {
    "text": "A billboard is way less likely to reach them versus something like a targeted cold email or a knock on their door.",
    "start": 113.52,
    "duration": 9.599000000000004
  },
  {
    "text": "Launch early.",
    "start": 121.2,
    "duration": 3.198999999999998
  },
  {
    "text": "This is something YC has preached from the beginning.",
    "start": 121.2,
    "duration": 4.5589999999999975
  },
  {
    "text": "In the early days, you don't know much about who these early users are, and [music] you want to engineer a wide surface area for them to find you.",
    "start": 123.119,
    "duration": 10.320999999999998
  },
  {
    "text": "Study your early users closely.",
    "start": 129.28,
    "duration": 5.5989999999999895
  },
  {
    "text": "You should be like an anthropologist that's [music] discovered a hidden civilization.",
    "start": 131.599,
    "duration": 6.881
  },
  {
    "text": "How do they make decisions? Why would they make the strange choice to trust you? You want to understand how they think and what they want.",
    "start": 134.879,
    "duration": 11.680999999999983
  },
  {
    "text": "Experiment fast and don't fear churn.",
    "start": 141.92,
    "duration": 6.719999999999999
  },
  {
    "text": "You should be running constant experiments, pricing, landing pages, onboarding, features, everything.",
    "start": 144.64,
    "duration": 8
  },
  {
    "text": "At the same time, talk to your early users and try to make them love the product.",
    "start": 148.64,
    "duration": 7.039999999999992
  },
  {
    "text": "But don't stress if you lose one of them.",
    "start": 152.64,
    "duration": 4.480000000000018
  },
  {
    "text": "If you annoy someone, you can usually fix it because the relationship is personal.",
    "start": 154.16,
    "duration": 6.480000000000018
  },
  {
    "text": "And if they churn, that's fine, too.",
    "start": 159.04,
    "duration": 2.8000000000000114
  },
  {
    "text": "There are plenty of others who haven't even heard of you yet.",
    "start": 160.64,
    "duration": 4.480000000000018
  },
  {
    "text": "This is one of the advantages startups have over big companies.",
    "start": 161.84,
    "duration": 6
  },
  {
    "text": "When you run a bad experiment, no one writes about it.",
    "start": 165.12,
    "duration": 3.83899999999997
  },
  {
    "text": "You're fighting irrelevance, not headlines.",
    "start": 167.84,
    "duration": 4.0800000000000125
  },
  {
    "text": "All of this may shape who you're even building for in the beginning.",
    "start": 168.959,
    "duration": 6.160999999999973
  },
  {
    "text": "Most people don't pay for a bunch of consumer apps.",
    "start": 171.92,
    "duration": 4.399000000000029
  },
  {
    "text": "The average personal software spend is [music] pretty tiny.",
    "start": 173.68,
    "duration": 6.9599999999999795
  },
  {
    "text": "For example, mine's about $150 a month total.",
    "start": 176.319,
    "duration": 5.9199999999999875
  },
  {
    "text": "Meanwhile, my corporate card has multiple tools that each cost more than that alone.",
    "start": 178.319,
    "duration": 8.40100000000001
  },
  {
    "text": "In the AI era, that gap matters.",
    "start": 182.239,
    "duration": 6.0800000000000125
  },
  {
    "text": "Consumer apps can struggle because ads often don't cover AI costs and subscriptions have to squeeze into an already small personal budget.",
    "start": 184.239,
    "duration": 11.120999999999981
  },
  {
    "text": "Of course, many consumer companies will still be made, but this is why many AI founders choose to start by selling to proumers or businesses or targeting users like doctors that have high advertising value.",
    "start": 192.159,
    "duration": 14.159999999999997
  },
  {
    "text": "This leads us to an even bigger point.",
    "start": 202,
    "duration": 5.840000000000003
  },
  {
    "text": "Your early users don't just give you feedback.",
    "start": 204.159,
    "duration": 5.520999999999987
  },
  {
    "text": "They end up steering how your product evolves over time.",
    "start": 206.319,
    "duration": 6.801000000000016
  },
  {
    "text": "Here's an analogy I use to help founders think about their first users.",
    "start": 209.68,
    "duration": 7.359999999999985
  },
  {
    "text": "Think of a startup as a phoggenetic tree.",
    "start": 213.12,
    "duration": 6
  },
  {
    "text": "Okay, bear with me.",
    "start": 214.72,
    "duration": 4.400000000000006
  },
  {
    "text": "The root nodes in amoeba and the leaf nodes are complex multisellular organisms like humans or dogs.",
    "start": 217.04,
    "duration": 8.080000000000013
  },
  {
    "text": "Almost every product you buy on the market has run this evolutionary process and morph from an amoeba to the maturity of a human or a dog.",
    "start": 220.879,
    "duration": 12.800999999999988
  },
  {
    "text": "Millions of users, a refined sales pitch, and clear value.",
    "start": 229.04,
    "duration": 6.800000000000011
  },
  {
    "text": "Early startups are more like amiebas.",
    "start": 233.68,
    "duration": 4
  },
  {
    "text": "They have just the very basic functions needed to get exposed to external pressures.",
    "start": 235.84,
    "duration": 7.038999999999987
  },
  {
    "text": "But from there, the founders run an evolutionary search through the tree of potential future directions.",
    "start": 239.12,
    "duration": 7.9199999999999875
  },
  {
    "text": "Consider Tesla as a case study, specifically their amoeba, the Tesla Roadster.",
    "start": 244.879,
    "duration": 8.321000000000026
  },
  {
    "text": "The lore about the Roadster is that Tesla needed a high margin product to fund their capex investment to make the Model S and eventually the Model 3 and Y.",
    "start": 249.12,
    "duration": 12.160000000000025
  },
  {
    "text": "That's probably true, but there's a second interpretation.",
    "start": 257.199,
    "duration": 5.920999999999935
  },
  {
    "text": "Tesla was searching for early adopters.",
    "start": 259.28,
    "duration": 5.279999999999973
  },
  {
    "text": "They wanted to find the people crazy enough to buy an impractical $150,000 car that didn't go very far, didn't fit much in it, couldn't publicly charge anywhere, and looked strange.",
    "start": 261.28,
    "duration": 13.440000000000055
  },
  {
    "text": "Tesla's story reveals another reality.",
    "start": 270.56,
    "duration": 6.319999999999993
  },
  {
    "text": "that product evolution is path dependent on what the early adopters wanted.",
    "start": 272.639,
    "duration": 8.161000000000001
  },
  {
    "text": "Why does the Tesla Model Y, a mass market vehicle, have a faster 0 to 60 than a Lamborghini and better tech than a BMW, but worse suspension and comfort than a Toyota? It turns out that early adopters cared much more about tech and acceleration than comfort.",
    "start": 276.88,
    "duration": 18.87900000000002
  },
  {
    "text": "Would a mass market vehicle designed in a vacuum have a 0 to 60 of under 3 seconds? Probably not.",
    "start": 291.68,
    "duration": 8.160000000000025
  },
  {
    "text": "But it's an outcome of the search algorithm that Tesla ran.",
    "start": 295.759,
    "duration": 8.480999999999938
  },
  {
    "text": "If early adopters were willing to pay $150,000 for a slow, plush vehicle, I bet Tesla's cars would look very different today.",
    "start": 299.84,
    "duration": 10.400000000000034
  },
  {
    "text": "This is the algorithm we help founders run at YC.",
    "start": 306.479,
    "duration": 5.120999999999981
  },
  {
    "text": "And it's why your first version shouldn't just be a minimum viable product.",
    "start": 310.24,
    "duration": 6.959000000000003
  },
  {
    "text": "It should be a minimum evolvable product.",
    "start": 313.44,
    "duration": 5.360000000000014
  },
  {
    "text": "Something simple that can respond to market pressures and evolve into a much more mature product.",
    "start": 315.039,
    "duration": 7.201000000000022
  },
  {
    "text": "Something that will survive contact with early users and adapt fast based on what they push it toward.",
    "start": 320.72,
    "duration": 6.7999999999999545
  },
  {
    "text": "It's freeing to know that the product will change a lot, so it doesn't have to be perfect from the start.",
    "start": 324.479,
    "duration": 7.841000000000065
  },
  {
    "text": "Ultimately, what it becomes will depend on where you begin and who you begin it with.",
    "start": 328.72,
    "duration": 7.159999999999968
  }
];

const NOOP_ADD_QUOTE = async () => { };

export function MockScriptSection() {
  const { tutorialState, lastPlacedNodeIdRef } = useTutorialDialogContext();
  const { getBlockInteractions } = useBlockInteraction();
  // Use ref as fallback so script seek works even when tutorialState.lastPlacedNodeId is overwritten by a step onComplete
  const blockMountId =
    (tutorialState.lastPlacedNodeId as string) ?? lastPlacedNodeIdRef.current ?? null;

  const handleTimeClick = useCallback(
    (seconds: number) => {
      // Resolve at click time so we use ref fallback even if state was overwritten
      const resolvedBlockMountId =
        (tutorialState.lastPlacedNodeId as string) ?? lastPlacedNodeIdRef.current ?? null;
      const interactions = resolvedBlockMountId ? getBlockInteractions(resolvedBlockMountId) : undefined;
      if (!resolvedBlockMountId) return;
      if (interactions?.seekTo) {
        interactions.seekTo(seconds);
      } else {
        console.warn('[Tutorial seek] No seekTo for blockMountId', resolvedBlockMountId);
      }
    },
    [tutorialState.lastPlacedNodeId, lastPlacedNodeIdRef, getBlockInteractions]
  );

  return (
    <TimelineTabContainer>
      <Box className="space-y-4 relative">
        <Box className="space-y-2">
          {MOCK_TRANSCRIPT.map((segment, index) => {
            const item = (
              <TimelineTranscriptItemView
                key={index}
                segment={{ start: segment.start, text: segment.text }}
                onTimeClick={handleTimeClick}
                onAddQuote={() => { void NOOP_ADD_QUOTE(); }}
                isLoading={false}
                readonly={true}
              />
            );
            return index === 2 ? (
              <InteractionGuard key={index} selector="script-timestamp">
                {item}
              </InteractionGuard>
            ) : (
              item
            );
          })}
        </Box>
        <TimelineTableOfContents
          transcript={MOCK_TRANSCRIPT}
          showTOC={true}
        />
      </Box>
    </TimelineTabContainer>
  );
}
