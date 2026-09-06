// Auto-generated list of experiences for which the user manually provided links
export const USER_VERIFIED_PLACE_IDS = new Set<number>([1087, 1094, 743, 744, 745, 764, 773, 781, 1215, 1491, 3752, 559, 1100, 3764, 3922, 3924, 3927, 1092, 1108, 1109, 1112, 1113, 1502, 1503, 1504, 1505, 1506, 1507, 1508, 1509, 1510, 3955, 3957, 4003, 4006, 4020, 282, 284, 309, 718, 719, 720, 721, 722, 723, 724, 725, 726, 727, 728, 729, 730, 731, 732, 733, 734, 735, 736, 737, 766, 779, 782, 786, 787, 794, 799, 800, 801, 802, 1363, 1367, 1374, 1387, 1388, 1391, 1393, 2023, 2024]);

export function isUserVerifiedExperience(id: number): boolean {
  return USER_VERIFIED_PLACE_IDS.has(id);
}
