# Life Flow of Light — Development History

[繁體中文](DevJournal.zh-TW.md) · [Project overview](../README.md) · [User Guide](UserGuide.md) · [Structure and Technology](StructureIntro.md)

Life Flow of Light did not begin on the day I created this GitHub repository.

Its origins lie in a course I attended and a subsequent competition and proposal experience. This document explains where the idea came from, how the current project relates to the earlier proposal, and how I turned my ideas into an interactive software demonstration.

For this repo development process details, go to:

- [Backend Development Journal](BackendDevJournal.md)
- [Frontend Development Journal](FrontendDevJournal.md)

## 1. Beginning with a course

From December 2021 to January 2022, I attended the course 「AI：智慧製造應用班」 offered by National Taiwan University of Science and Technology.

The course covered AI and smart manufacturing applications. It ran from 5 December 2021 to 23 January 2022 and comprised 49 hours of training.

During the course, I learned about and participated in 「2022 第 17 屆戰國策全國創新創業競賽」. The idea for Life Flow of Light developed during that experience.

The competition's Chinese name is retained here without an English translation.

For me, this was an opportunity both to learn about technology and to consider the everyday problems it might help address.

## 2. My starting point: traces of daily life in lighting activity

My interest was in people living alone, particularly older adults.

Some people are unfamiliar with smartphones or wearable devices. They may also be uncomfortable with cameras continuously recording their homes. Yet switching household lights on and off remains an ordinary part of many people's daily lives.

This led me to propose a question:

Could household lighting records provide limited clues about daily activity, helping people living alone and their trusted family members understand changes in routine?

A bedroom light turning on in the morning, a living room light being used in the evening, or lights being switched off before bed are ordinary events. Viewed together on a timeline, they may reveal patterns worth understanding.

The idea is to explore what lighting records can tell us while reducing direct observation of private life.

Lighting remains an indirect indicator. It cannot, by itself, establish whether someone is safe or healthy.

## 3. The earlier team proposal

At that time, I worked with teammate 陳怡安, to discuss and develop the ideas under the team name 「安欣製作」. This work included a proposal titled 「歲月流明」.

The teammate's name, team name, and historical proposal title are retained in Chinese without translation or romanization.

That proposal covered a much broader scope than the current GitHub project, including sensing devices, cloud processing, routine analysis, notification workflows, usage scenarios, and service operations.

It recorded the team's discussions and responses to reviewer feedback, presenting a vision for a more complete service.

That experience forms part of this project's history. However, plans in the earlier proposal do not mean that those features were implemented or are available in the current repository.

## 4. This repository and the scope of my contribution

The idea of using lighting activity records as clues about independent living was my own proposal.

The earlier team discussions also included ideas contributed by other participants. When creating this repository, I selected only the parts I had proposed for implementation. I did not incorporate the parts proposed by those other participants.

The current repository is a software proof of concept whose design, development, and documentation I lead as an individual project. It is not a direct transfer of the entire historical team proposal to GitHub, nor a product jointly maintained or released by the original team.

I include this history so readers can understand the work's origins and distinguish the earlier discussions from the present implementation.

For this project's usage and licensing information, see the root [README](../README.md). Third-party packages remain subject to their respective licenses.

## 5. Turning the idea into an interactive PoC

In 2026, I revisited the idea and developed it into the current Life Flow of Light software demonstration.

I chose to begin with a workflow that could run locally and be understood through direct interaction:

1. Operate virtual lights in a browser.
2. Record lighting activity in a database.
3. Review the records on a timeline.
4. Explore whether switching patterns can be interpreted as Morse messages.

The current version uses software simulation. It does not require physical smart bulbs or sensors.

This scope lets me work through concrete problems in data recording, interface interaction, and signal interpretation. It also lets readers try the idea without first assembling hardware.

The sensing-device integration, routine prediction, care notifications, and service operations described in the earlier proposal are outside the current implementation. The project's connection to an AI-related course does not mean that the current version implements an AI prediction model.

## 6. From backend to frontend

I began with the backend: bulb data, installation positions, activity records, historical queries, and Morse interpretation.

I then built the frontend around four expandable and collapsible panels:

| Panel | Main purpose |
| --- | --- |
| Bulbs | Manage bulbs and installation positions. |
| House | Operate virtual lights and send signals. |
| History | Review live activity and historical sessions. |
| Morse | Practise Morse timing and search for messages. |

The development process involved more than connecting APIs to a screen.

I also worked through lighting state after a page reload, preventing an active bulb from being uninstalled, timeline zooming, date-range validation, bilingual text, and easily misunderstood pauses during Morse practice.

These details helped me understand that making a feature run and making it understandable and usable are both necessary parts of development.

## 7. Read the detailed development journals

The following journals are written in English. They preserve the design decisions, changes, tests, and lessons from successive stages of development.

| Document | Contents |
| --- | --- |
| [Backend Development Journal](BackendDevJournal.md) | Database design, APIs, heartbeats and lighting sessions, Morse decoding, demonstration data, and automated tests. |
| [Frontend Development Journal](FrontendDevJournal.md) | React components, panel layouts, bulb controls, historical timelines, Morse lessons, bilingual interfaces, and layout refinements. |

You can begin with the backend to understand how data is produced and stored, then read the frontend journal to see how that data is presented.

You can also start with whichever feature interests you most.

Because the journals accumulated during development, earlier sections may contain names, designs, or unfinished tasks that changed later. They preserve the thinking at that time; not every entry describes the current version.

For current installation and operation steps, use the [User Guide](UserGuide.md). For an architectural overview, see [Structure and Technology](StructureIntro.md).

## 8. Why I keep these records

I want this repository to show more than the finished interface.

I also want to preserve how I developed an idea from an everyday problem, narrowed its implementation scope, investigated errors, and gradually improved the work.

Life Flow of Light remains a proof of concept. It gives readers a way to see and interact with my idea, while giving me a concrete implementation through which to examine its possibilities and limitations.