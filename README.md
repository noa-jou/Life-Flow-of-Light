# Life Flow of Light 

[歲月流明](README.zh-TW.md)

<p align="center">
  <img src="Icon.png"
       width="100"
       height="100"
       alt="Icon">
</p>

**A Privacy-Conscious Proof of Concept for Independent Living Monitoring**

## 1. Project Overview

**Life Flow of Light** is a Proof of Concept (PoC) exploring how everyday lighting activities could provide a passive, minimally intrusive way to detect signs of activity in the homes of people living alone, particularly older adults.

The idea is to help family members notice unusual changes in daily routines without relying on cameras, microphones, or other highly intrusive monitoring devices.

Turning this concept into a reliable, commercially viable product would require the expertise, infrastructure, and resources of established smart home or assisted living technology companies. Developing the necessary hardware integration, cloud infrastructure, privacy safeguards, and large-scale service operations is beyond the scope of this repository.

**This project is therefore a concept proposal, not a complete commercial solution.**

I am developing this demonstration primarily to showcase my creativity, technical abilities, and product thinking as part of my professional portfolio and job search.

However, I also welcome collaboration with companies or researchers interested in exploring this concept further. Anyone wishing to reuse the original source code or other copyrighted materials from this repository for commercial purposes should contact me to discuss licensing and obtain permission.

## 2. Inspiration and Concept

The name *Life Flow of Light* was inspired by traditional Chinese expressions that connect light with life and the passage of time:

- **人死如燈滅** — *When life ends, the light goes out.*
- **一寸光陰一寸金** — *An inch of time is worth an inch of gold.*

These expressions led me to consider how light, something so ordinary in our daily lives, might become a gentle indicator of human activity.

Even older adults who rarely use smartphones, computers, or other electronic devices are likely to interact with household lighting as part of their daily routines.

For example, turning on a bedroom light in the morning, switching on the living room light in the evening, or turning off the lights before bedtime may collectively reveal patterns of activity over time.

For individuals who are uncomfortable with cameras inside their homes, voluntarily sharing limited lighting activity records with trusted family members could offer a less intrusive alternative.

Smart lighting technology already exists. Many connected light bulbs and switches can report their current on/off status and can be assigned to specific rooms, such as a bedroom or living room.

My proposal is to explore how these existing capabilities could be integrated into a cloud-based activity-recording and visualization system designed specifically for independent living support.

Rather than continuously observing what a person is doing, the system would focus on **when changes in everyday household activity occur**.

With appropriate consent, security, and data access controls, family members could review these activity patterns and notice unusual changes that might deserve a friendly check-in.

Importantly, lighting activity is only an indirect indicator of human activity. A lack of lighting changes does not necessarily indicate an emergency, and normal lighting activity does not guarantee a person's safety.

## 3. Proof of Concept and Technical Scope

This repository will contain a simple frontend application and a lightweight backend to visually demonstrate how the proposed system might operate.

The planned demonstration includes:

- **Virtual smart lights:** Interactive controls representing lights in different rooms.
- **Event logging:** Recording light on/off events with timestamps in a database.
- **Activity timeline:** Displaying lighting activity as a Gantt-style timeline.
- **Basic system workflow:** Demonstrating how lighting events could be collected, stored, and presented.

For this initial PoC, lighting events will be generated through the frontend rather than physical sensors or smart light bulbs.

**No physical hardware integration is planned for this demonstration.**

The goal is to communicate the concept clearly, not to build or validate a complete hardware system.

A real-world implementation would require additional engineering work, including smart device integration, secure cloud communication, scalable data storage, user authentication, consent management, and evaluation of reliability and false alerts.

## 4. Potential Extension: Morse Code Communication

An additional possibility is to explore whether patterns of light switching could be interpreted as **Morse code**, creating an optional, discreet communication channel.

For example, a predefined sequence of light on/off events could represent a short message or a request for assistance.

Such a feature might allow someone to communicate a simple signal through an existing household interface without requiring a smartphone.

This is a speculative extension rather than a validated feature. Any practical implementation would need to address accidental signals, timing accuracy, privacy, consent, and dependable message delivery.

## 5. Project Status

**Status: Early-stage concept / Proof of Concept**

This repository is an evolving demonstration and should not be treated as a production-ready monitoring system, medical device, emergency alert service, or guarantee of personal safety.

## 6. Copyright and Collaboration

Copyright © 2026. All rights reserved.

This repository is publicly available for demonstration and portfolio purposes. Its original source code, documentation, and visual materials are not released under an open-source license.

Commercial reuse, redistribution, or modification of these copyrighted materials requires prior permission from the author.

The general concept described in this repository is not claimed to be an exclusive invention or patented technology.

I welcome discussions with smart home companies, independent living technology providers, researchers, and developers who may be interested in evaluating or developing this idea further.

[How to use this repo](UserGuide.md)

