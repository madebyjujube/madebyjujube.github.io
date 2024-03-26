Project Description: 

A web based user interface allowing visitors to record an audio snippet using their voice (5 seconds max). 
The audio will be recorded into a buffer, which they should then rename matching the vowel or onomatopoeia they just recorded. 
The file will then be pushed to a server, making it available to other visitors.

Audio files will live in the server, and be displayed on the front-end using a 3D force directed graph. 
The graph will allow user interactions that trigger and manipulate the audio (like pitch, spatialization, and other effects). 

What I currently have: 

- 3D force graph boiler-p
- Basic script to read and write JSON files.
- A simple audio recorder

What I need help with: 

- Retrieving the position of each node
- Pass node[i].pos.xyz to a var (I will manipulate the audio with)
  - I have difficulty wrapping my head around JS logic when using a library that has more complex nested functions...
- Grasping the inner workings of the ForceGraph3D() funcrtion in 3D-Force-Graph (https://github.com/vasturiano/d3-force-3d?tab=readme-ov-file)

