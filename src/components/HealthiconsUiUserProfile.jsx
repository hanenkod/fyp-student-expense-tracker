import { IconBox } from "./IconBox";

export const HealthiconsUiUserProfile = ({ className = "" }) => (
  <IconBox className={className} innerW={24} innerH={24} opticalScale={0.97}>
    <g transform="scale(0.5)" fill="currentColor">
      <path d="M32 20a8 8 0 1 1-16 0a8 8 0 0 1 16 0" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M23.184 43.984C12.517 43.556 4 34.772 4 24C4 12.954 12.954 4 24 4s20 8.954 20 20s-8.954 20-20 20h-.274q-.272 0-.542-.016M11.166 36.62a3.028 3.028 0 0 1 2.523-4.005c7.796-.863 12.874-.785 20.632.018a2.99 2.99 0 0 1 2.498 4.002A17.94 17.94 0 0 0 42 24c0-9.941-8.059-18-18-18S6 14.059 6 24c0 4.916 1.971 9.373 5.166 12.621"
      />
    </g>
  </IconBox>
);
