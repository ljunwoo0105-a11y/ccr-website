import React from 'react';
import {AbsoluteFill, Audio, Series, staticFile, useVideoConfig, interpolate} from 'remotion';
import type {CalculateMetadataFunction} from 'remotion';
import {SceneBoard, SceneCTA, SceneCover, SceneProcedure, SceneReviews, SceneServices} from './scenes';
import {VSceneBoard, VSceneCTA, VSceneCover, VSceneProcedure, VSceneReviews, VSceneServices} from './scenes-vertical';

export type SceneTiming = {
  durationInFrames: number;
};

export type CCRPromoProps = {
  scenes: SceneTiming[];
};

export const FPS = 30;

/** Music-only cut: fixed scene lengths, no narration to fit around */
const SCENE_SECS = [6.5, 8, 8.5, 8, 8, 9.5];

export const calculateCCRMetadata: CalculateMetadataFunction<CCRPromoProps> = async ({props}) => {
  const scenes: SceneTiming[] = SCENE_SECS.map((s) => ({durationInFrames: Math.round(s * FPS)}));
  const durationInFrames = scenes.reduce((a, s) => a + s.durationInFrames, 0);
  return {
    durationInFrames,
    props: {...props, scenes},
  };
};

const SCENE_COMPONENTS = [SceneCover, SceneServices, SceneProcedure, SceneBoard, SceneReviews, SceneCTA];
const V_SCENE_COMPONENTS = [VSceneCover, VSceneServices, VSceneProcedure, VSceneBoard, VSceneReviews, VSceneCTA];

/** Full-level music bed with a short fade-in and an end fade-out */
const musicVolume = (frame: number, totalFrames: number): number => {
  const intro = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fade = interpolate(frame, [totalFrames - 60, totalFrames - 6], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return 0.9 * intro * fade;
};

const PromoBase: React.FC<CCRPromoProps & {components: React.FC[]}> = ({scenes, components}) => {
  const {durationInFrames} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: '#F4F1E8'}}>
      <Audio src={staticFile('music.wav')} volume={(f) => musicVolume(f, durationInFrames)} />
      <Series>
        {scenes.map((s, i) => {
          const SceneComp = components[i];
          return (
            <Series.Sequence key={i} durationInFrames={s.durationInFrames}>
              <SceneComp />
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};

export const CCRPromo: React.FC<CCRPromoProps> = ({scenes}) => (
  <PromoBase scenes={scenes} components={SCENE_COMPONENTS} />
);

export const CCRPromoVertical: React.FC<CCRPromoProps> = ({scenes}) => (
  <PromoBase scenes={scenes} components={V_SCENE_COMPONENTS} />
);
