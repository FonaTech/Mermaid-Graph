import type { MermaidProject } from '../types';

export const SAMPLE_CODE = `graph TD
    %% Define Title
    Title[<B>Objective: Multi-Scale Self-Consistent µ-GNN Framework</B>]:::title

    %% Define Sub-graphs/Containers
    subgraph GNN_Framework [Unified Computing Architecture]
        direction TB
        %% Core Node
        µGNN[<B>µ-GNN</B><br/>(Mixed-Granularity-Aware<br/>Graph Neural Network)]:::coreNode
        
        %% Architecture Pillar
        subgraph SC_Compute [Self-Consistent Computing]
            direction LR
            UnifiedIP[Unified Information-Passing Framework]:::method
            UnifiedIP <--> µGNN
        end
    end

    %% Define Input/Physical Scales Branch
    subgraph Scales [Bridging Multi-Granularity Physical Scales]
        direction TB
        Subatomic[Subatomic]:::scale
        Atomic[Atomic]:::scale
        Domain[Domain]:::scale
        
        OvercomeLim[Overcoming Local<br/>Single-Scale Limitations]:::limit
        OvercomeLim -.- Subatomic
        
        Subatomic ==> Atomic ==> Domain
        Domain ==>|Simultaneous Processing| µGNN
    end

    %% Define Output/AI Branch
    subgraph AI_Perception [AI-Driven Perception]
        direction TB
        RL[<B>Reinforcement Learning</B>]:::method
        ExcitedState[<B>Non-Ground State</B><br/>Electronic Properties]:::result
        
        µGNN ==> RL
        RL ==> ExcitedState
    end

    %% Link Title to the whole
    Title --> GNN_Framework

    %% Apply overall styles
    classDef title fill:none,stroke:none,font-size:24px,color:#003366,font-weight:bold;
    classDef coreNode fill:#FFD700,stroke:#B8860B,stroke-width:2px,rx:10,ry:10,font-size:18px,color:black,font-weight:bold;
    classDef scale fill:#D0E8FF,stroke:#004080,stroke-width:1px,rx:5,ry:5,font-size:14px,color:#002040;
    classDef method fill:#E6FFE6,stroke:#006400,stroke-width:1px,rx:5,ry:5,font-size:14px,color:#004000;
    classDef result fill:#FFE6E6,stroke:#8B0000,stroke-width:2px,rx:5,ry:5,font-size:16px,color:#600000,font-weight:bold;
    classDef limit fill:none,stroke:none,font-size:12px,color:#555,font-style:italic;

    %% Adjust Link Styles for 2:1 ratio
    linkStyle default interpolate basis stroke:#555,stroke-width:1.5px;
    linkStyle 3,4 stroke:#000,stroke-width:3px; /* Strong Multi-Scale flow */
    linkStyle 5 stroke:#B8860B,stroke-width:2px,stroke-dasharray: 5 5; /* SC feedback */
    linkStyle 7,8 stroke:#000,stroke-width:3px; /* Final AI drive */`;

export const SAMPLE_PROJECT: MermaidProject = {
  id: 'sample-multiscale-mugn',
  name: 'Multi-Scale µ-GNN Framework',
  kind: 'flowchart',
  code: SAMPLE_CODE,
  description: 'A scientific flowchart with subgraphs, classes, and styled links.',
  updatedAt: Date.now(),
};
