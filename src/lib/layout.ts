import {createContext, useContext} from 'react';

/**
 * Horizontal safe inset (px, in 1920-wide scene space). 0 for the 16:9 video;
 * the vertical Shorts version sets it so edge-pinned overlays stay on screen.
 */
export const InsetContext = createContext(0);
export const useInset = () => useContext(InsetContext);
