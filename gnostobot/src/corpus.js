import { commentaryPassages, commentarySources } from './commentary.js';

export { commentaryPassages, commentarySources };

export const SOURCE_CUTOFF_YEAR = 1850;

export const sources = [
  {
    id: 'thomas',
    title: 'Gospel of Thomas',
    siglum: 'NHC II,2',
    witness: 'Nag Hammadi Codex II, tractate 2',
    manuscriptDate: 'mid-4th century CE',
    latestManuscriptYear: 375,
    compositionDate: 'c. 50–140 CE',
    tradition: 'Sayings gospel',
    description: 'A collection of 114 sayings attributed to Jesus, preserved in Coptic with earlier Greek fragments.',
    provenance: 'Papyrus codex buried near ancient Chenoboskion; recovered in 1945. Physical witness predates 1850.',
    url: 'https://www.earlychristianwritings.com/text/thomas-fifth.html',
    accessLabel: 'Berlin Working Group English translation'
  },
  {
    id: 'john',
    title: 'Apocryphon of John',
    siglum: 'NHC II,1; III,1; IV,1; BG 8502,2',
    witness: 'Three Nag Hammadi witnesses and Berlin Codex 8502',
    manuscriptDate: '4th–5th centuries CE',
    latestManuscriptYear: 500,
    compositionDate: 'c. 120–180 CE',
    tradition: 'Sethian revelatory discourse',
    description: 'A revelation dialogue presenting the Invisible Spirit, Barbelo, Sophia, the rulers, humanity, and awakening.',
    provenance: 'Four ancient Coptic witnesses preserve long and short recensions. Every witness predates 1850.',
    url: 'https://www.earlychristianwritings.com/text/apocryphonjohn.html',
    accessLabel: 'Frederik Wisse English translation'
  },
  {
    id: 'truth',
    title: 'Gospel of Truth',
    siglum: 'NHC I,3; XII,2',
    witness: 'Nag Hammadi Codices I and XII',
    manuscriptDate: 'mid-4th century CE',
    latestManuscriptYear: 375,
    compositionDate: 'c. 140–180 CE',
    tradition: 'Valentinian meditation',
    description: 'A homiletic meditation in which ignorance becomes fear and forgetfulness, while knowledge restores rest.',
    provenance: 'Coptic papyrus witnesses from the Nag Hammadi cache, recovered in 1945.',
    url: 'https://www.earlychristianwritings.com/text/gospeltruth.html',
    accessLabel: 'Robert M. Grant English translation'
  },
  {
    id: 'philip',
    title: 'Gospel of Philip',
    siglum: 'NHC II,3',
    witness: 'Nag Hammadi Codex II, tractate 3',
    manuscriptDate: 'mid-4th century CE',
    latestManuscriptYear: 375,
    compositionDate: 'c. 180–250 CE',
    tradition: 'Valentinian sacramental anthology',
    description: 'A collection of reflections on names, images, resurrection, anointing, union, and the bridal chamber.',
    provenance: 'Coptic papyrus tractate preserved in Nag Hammadi Codex II.',
    url: 'https://www.earlychristianwritings.com/text/gospelphilip.html',
    accessLabel: 'Wesley W. Isenberg English translation'
  },
  {
    id: 'mary',
    title: 'Gospel of Mary',
    siglum: 'BG 8502,1; P.Ryl. 463; P.Oxy. 3525',
    witness: 'Berlin Codex 8502 plus two Greek papyrus fragments',
    manuscriptDate: '3rd–5th centuries CE',
    latestManuscriptYear: 500,
    compositionDate: 'c. 120–180 CE',
    tradition: 'Revelation dialogue',
    description: 'Mary recounts teaching about the inner Human, vision through mind, and the soul passing hostile powers.',
    provenance: 'Ancient Greek fragments and a longer Coptic witness. Discovery dates are later; physical witnesses are ancient.',
    url: 'https://www.earlychristianwritings.com/text/gospelmary.html',
    accessLabel: 'Gnostic Society Library English translation mirror'
  },
  {
    id: 'jeu',
    title: 'Books of Jeu',
    siglum: 'Bruce Codex',
    witness: 'Bruce Codex, two Books of Jeu',
    manuscriptDate: 'c. 5th–6th century CE',
    latestManuscriptYear: 600,
    compositionDate: 'c. 200–250 CE',
    tradition: 'Ritual and ascent manual',
    description: 'Diagram-rich instructions concerning treasuries, seals, names, baptisms, watchers, and ascent.',
    provenance: 'Coptic papyrus acquired by James Bruce in 1769; now Bodleian Library. Both witness and acquisition predate 1850.',
    url: 'https://www.earlychristianwritings.com/text/booksjeu.html',
    accessLabel: 'Violet MacDermot summary and text selections'
  },
  {
    id: 'resurrection',
    title: 'Treatise on the Resurrection',
    siglum: 'NHC I,4',
    witness: 'Nag Hammadi Codex I, tractate 4',
    manuscriptDate: 'mid-4th century CE',
    latestManuscriptYear: 375,
    compositionDate: 'c. 170–200 CE',
    tradition: 'Valentinian letter',
    description: 'A letter to Rheginos treating resurrection as real, transformative, and already participated in.',
    provenance: 'Coptic papyrus tractate in the Jung Codex from the Nag Hammadi cache.',
    url: 'https://www.earlychristianwritings.com/text/treatiseresurrection.html',
    accessLabel: 'Malcolm L. Peel English translation'
  },
  {
    id: 'trimorphic',
    title: 'Trimorphic Protennoia',
    siglum: 'NHC XIII,1',
    witness: 'Nag Hammadi Codex XIII leaves',
    manuscriptDate: 'mid-4th century CE',
    latestManuscriptYear: 375,
    compositionDate: 'c. 160–230 CE',
    tradition: 'Sethian revelation hymn',
    description: 'First Thought speaks in three descents—as thought, voice, and word—to awaken and gather her seed.',
    provenance: 'Eight papyrus leaves reused inside the cover of Nag Hammadi Codex VI; recovered with the cache in 1945.',
    url: 'https://www.earlychristianwritings.com/text/trimorphic.html',
    accessLabel: 'John D. Turner English translation'
  },
  {
    id: 'pistis',
    title: 'Pistis Sophia',
    siglum: 'Askew Codex',
    witness: 'Askew Codex',
    manuscriptDate: 'c. 4th century CE',
    latestManuscriptYear: 400,
    compositionDate: 'c. 200–300 CE',
    tradition: 'Post-resurrection dialogue',
    description: 'A long Coptic dialogue centred on Sophia’s error, repeated repentance, rescue, mysteries, and ascent.',
    provenance: 'Ancient parchment codex acquired by the British Museum in 1785. Witness and acquisition predate 1850.',
    url: 'https://archive.org/details/pistissophiaopu00petegoog',
    accessLabel: 'Archive scan of the Coptic text'
  }
];

export const passages = [
  {
    id: 'thomas-3', sourceId: 'thomas', locator: 'Sayings 3 and 5',
    keywords: ['gnosis', 'self knowledge', 'kingdom', 'inside', 'outside', 'hidden', 'seek', 'identity'],
    summary: 'The kingdom is not confined to sky or sea; it is inside and outside the seeker. Coming to know oneself discloses kinship with the living source.',
    counsel: 'Begin with what stands directly before you. Let inner recognition and outer conduct test one another.'
  },
  {
    id: 'thomas-22', sourceId: 'thomas', locator: 'Saying 22',
    keywords: ['oneness', 'duality', 'two', 'one', 'division', 'unity', 'child', 'integration'],
    summary: 'Entry is pictured as making the two one: inside like outside, above like below, divided images restored to unity.',
    counsel: 'Do not solve division by destroying one side. Seek the deeper pattern in which the opposites can become whole.'
  },
  {
    id: 'thomas-24', sourceId: 'thomas', locator: 'Sayings 24 and 70',
    keywords: ['light', 'within', 'darkness', 'bring forth', 'guidance', 'spark', 'life'],
    summary: 'A light is said to dwell within a person of light; when brought forth it illuminates the whole world, but when withheld there is darkness.',
    counsel: 'Bring the hidden clarity into action. Unexpressed insight does not yet illuminate anything.'
  },
  {
    id: 'thomas-77', sourceId: 'thomas', locator: 'Saying 77',
    keywords: ['all', 'light', 'wood', 'stone', 'presence', 'divine', 'world'],
    summary: 'Light is presented as pervading the whole: it is encountered not only in sanctuaries, but when wood is split and stone is lifted.',
    counsel: 'Look for the sacred in the ordinary material before searching for a distant realm.'
  },
  {
    id: 'mary-root', sourceId: 'mary', locator: 'BG 8502, pages 7–8',
    keywords: ['root', 'good', 'nature', 'healing', 'matter', 'passion', 'suffering'],
    summary: 'The Good enters every nature to restore it to its root. Sickness is linked to deprivation of what heals and reorients desire.',
    counsel: 'Ask what root your present impulse serves: the Good that restores, or passion multiplying itself without measure.'
  },
  {
    id: 'mary-within', sourceId: 'mary', locator: 'BG 8502, page 8',
    keywords: ['within', 'human', 'son of man', 'direction', 'follow', 'teacher', 'authority'],
    summary: 'The text warns against being sent chasing “here” or “there”; the Human One is within, and the instruction is to follow that inward disclosure.',
    counsel: 'Do not outsource discernment to every loud direction. Test the inner witness without turning it into vanity.'
  },
  {
    id: 'mary-mind', sourceId: 'mary', locator: 'BG 8502, pages 10 and 15–17',
    keywords: ['mind', 'vision', 'soul', 'spirit', 'powers', 'desire', 'ignorance', 'wrath', 'ascent', 'rest'],
    summary: 'Vision is located in mind between soul and spirit. The ascending soul answers powers named desire, ignorance, fleshly wisdom, and wrath before reaching rest.',
    counsel: 'Name the power speaking through you. Recognition loosens its claim; non-judgment and steadiness keep the ascent moving.'
  },
  {
    id: 'john-invisible', sourceId: 'john', locator: 'NHC II 2:26–4:10',
    keywords: ['monad', 'invisible spirit', 'ineffable', 'unnameable', 'source', 'god', 'silence', 'mystery'],
    summary: 'The first source is described through disciplined negation: invisible, immeasurable, unsearchable, unnameable, lacking nothing, beyond every imposed category.',
    counsel: 'When speaking of the highest, treat certainty as a limit. Clear away false definitions before adding another name.'
  },
  {
    id: 'john-barbelo', sourceId: 'john', locator: 'NHC II 4:26–6:10',
    keywords: ['barbelo', 'forethought', 'first thought', 'image', 'mother', 'aeon', 'mind', 'reflection'],
    summary: 'Barbelo appears as the first Thought and luminous image of the Invisible Spirit, requesting foreknowledge, incorruptibility, eternal life, and truth.',
    counsel: 'Right creation begins as clear forethought aligned with life and truth, not as blind compulsion.'
  },
  {
    id: 'john-sophia', sourceId: 'john', locator: 'NHC II 9:25–13:13',
    keywords: ['sophia', 'wisdom', 'yaldabaoth', 'demiurge', 'archon', 'ruler', 'error', 'creation', 'world', 'false god'],
    summary: 'Sophia acts without her counterpart and produces an imperfect ruler, Yaldabaoth. Ignorant of what precedes him, he mistakes borrowed power for sole divinity and forms subordinate rulers.',
    counsel: 'Power becomes delusion when it forgets its source. Examine every voice claiming to be the whole because it controls a part.'
  },
  {
    id: 'john-adam', sourceId: 'john', locator: 'NHC II 14:13–20:9',
    keywords: ['adam', 'human', 'spark', 'light', 'rulers', 'body', 'breath', 'image', 'awakening'],
    summary: 'The rulers fashion a human image but cannot make it stand until power from above enters. What they meant to confine becomes the force that exceeds them.',
    counsel: 'Do not confuse the structure holding life with the source of life. Systems can shape a vessel without owning its deepest power.'
  },
  {
    id: 'john-epinoia', sourceId: 'john', locator: 'NHC II 20:9–23:35',
    keywords: ['epinoia', 'insight', 'eve', 'helper', 'knowledge', 'awakening', 'tree', 'salvation', 'freedom'],
    summary: 'Luminous Epinoia—insight—enters the human story as a helper, awakens Adam from forgetfulness, and exposes the rulers’ counterfeit command.',
    counsel: 'Freedom starts when insight makes the hidden command visible. What can be seen clearly can be answered rather than merely obeyed.'
  },
  {
    id: 'truth-fog', sourceId: 'truth', locator: 'NHC I 17:10–18:11',
    keywords: ['fear', 'terror', 'fog', 'error', 'ignorance', 'anxiety', 'confusion', 'forgetfulness'],
    summary: 'Ignorance of the source gives rise to terror; terror thickens like fog, and error gains force by shaping fear and forgetfulness into apparent reality.',
    counsel: 'Do not treat the fog as a substance. Find the missing knowledge from which the fear is borrowing its shape.'
  },
  {
    id: 'truth-knowledge', sourceId: 'truth', locator: 'NHC I 18:11–19:27',
    keywords: ['knowledge', 'forgetfulness', 'father', 'revelation', 'darkness', 'healing', 'gnosis'],
    summary: 'Forgetfulness is not rooted in the Father; it persists through not knowing. When knowledge is disclosed, forgetfulness ceases rather than being defeated by equal force.',
    counsel: 'Replace repetitive struggle with recognition. Some darkness ends through seeing what was always present.'
  },
  {
    id: 'truth-nightmare', sourceId: 'truth', locator: 'NHC I 28:32–29:32',
    keywords: ['dream', 'nightmare', 'sleep', 'wake', 'illusion', 'fear', 'escape', 'rest'],
    summary: 'The terrors of ignorance are compared to nightmares. Awakening reveals that the frantic chase lacked the reality it seemed to possess during sleep.',
    counsel: 'Before fighting every apparition, ask what waking would mean. A changed level of awareness may dissolve the battlefield.'
  },
  {
    id: 'truth-rest', sourceId: 'truth', locator: 'NHC I 41:14–43:24',
    keywords: ['rest', 'unity', 'return', 'fragrance', 'anointing', 'fullness', 'peace'],
    summary: 'Return is figured as recovery of unity and rest: scattered lack gives way when each one receives the anointing and is drawn toward the source.',
    counsel: 'Let rest mean collected presence, not avoidance. Gather the scattered parts around what they truly lack.'
  },
  {
    id: 'philip-names', sourceId: 'philip', locator: 'NHC II 53:23–54:13',
    keywords: ['names', 'language', 'truth', 'deception', 'labels', 'reality', 'symbols', 'words'],
    summary: 'Worldly names can deceive when mistaken for the realities they indicate. Truth uses many names to teach the one thing, but no label owns it.',
    counsel: 'Use words as doors, not prisons. Ask what reality a label reveals—and what it hides.'
  },
  {
    id: 'philip-resurrection', sourceId: 'philip', locator: 'NHC II 56:15–20 and 73:1–8',
    keywords: ['resurrection', 'death', 'alive', 'now', 'body', 'transformation', 'practice'],
    summary: 'Resurrection is not postponed entirely until after death. The text insists it must be received while alive, as a present transformation.',
    counsel: 'Do not make awakening a future excuse. Live today in the form you claim will be restored.'
  },
  {
    id: 'philip-seeing', sourceId: 'philip', locator: 'NHC II 61:20–35',
    keywords: ['seeing', 'become', 'image', 'spirit', 'christ', 'father', 'transformation', 'attention'],
    summary: 'Ordinary sight observes objects while remaining separate; sacred seeing transforms the seer—seeing spirit, one becomes spirit; seeing the anointed, one becomes anointed.',
    counsel: 'Choose attention carefully. Sustained contemplation forms the one who contemplates.'
  },
  {
    id: 'philip-bridal', sourceId: 'philip', locator: 'NHC II 67:27–69:4',
    keywords: ['bridal chamber', 'union', 'image', 'angel', 'division', 'marriage', 'wholeness', 'sacrament'],
    summary: 'The bridal chamber symbolizes restoration of a divided image: inner and heavenly counterparts are joined so hostile forces no longer enter the gap.',
    counsel: 'Seek union at the level that ends inner contradiction, not possession of another person.'
  },
  {
    id: 'jeu-understanding', sourceId: 'jeu', locator: 'Books of Jeu, chapters 1–4',
    keywords: ['understanding', 'archon', 'mind', 'heaven', 'ignorance', 'word', 'world', 'freedom'],
    summary: 'The opening teaching contrasts ignorance with the understanding that saves from the ruler of the age and raises human minds toward heaven.',
    counsel: 'Freedom requires trained understanding. Rejection alone leaves the ruling pattern intact inside the mind.'
  },
  {
    id: 'jeu-treasuries', sourceId: 'jeu', locator: 'Book I, chapters 33–41',
    keywords: ['treasuries', 'seal', 'diagram', 'watchers', 'gates', 'ascent', 'map', 'names', 'practice'],
    summary: 'Diagrams, seals, names, veils, and watchers map passage through treasuries of light. The route is staged, exacting, and learned rather than improvised.',
    counsel: 'Treat ascent as practice with gates and disciplines. Inspiration without a map easily circles the same threshold.'
  },
  {
    id: 'jeu-baptisms', sourceId: 'jeu', locator: 'Book II, chapters 42–48',
    keywords: ['baptism', 'water', 'fire', 'spirit', 'mystery', 'worthy', 'money', 'ethics', 'seal'],
    summary: 'Water, fire, and spirit baptisms prepare passage, while the mysteries are not to be sold for worldly goods or handed over without discernment.',
    counsel: 'A sacred method is corrupted when technique is severed from readiness and ethics.'
  },
  {
    id: 'resurrection-real', sourceId: 'resurrection', locator: 'NHC I 43:25–46:2',
    keywords: ['resurrection', 'real', 'illusion', 'truth', 'christ', 'faith', 'transformation', 'death'],
    summary: 'The letter rejects treating resurrection as fantasy. It is grounded in truth and participated in through the risen one, not reduced to survival of an unchanged self.',
    counsel: 'Ask what truly rises. Restoration is not preservation of every habit that produced the old captivity.'
  },
  {
    id: 'resurrection-present', sourceId: 'resurrection', locator: 'NHC I 46:3–49:9',
    keywords: ['already', 'now', 'future', 'practice', 'garment', 'flesh', 'spirit', 'change'],
    summary: 'The recipient is addressed as already having resurrection while still moving toward its completion; present participation and future unveiling are held together.',
    counsel: 'Practice the future reality now without pretending the work is finished.'
  },
  {
    id: 'trimorphic-thought', sourceId: 'trimorphic', locator: 'NHC XIII 35:1–42:3',
    keywords: ['first thought', 'protennoia', 'voice', 'word', 'descent', 'seed', 'awakening', 'barbelo'],
    summary: 'First Thought descends in three movements—as thought, voice, and word—entering lower realms so her scattered seed can hear and remember its origin.',
    counsel: 'True guidance does not merely call from above; it takes a form that can be heard where forgetfulness lives.'
  },
  {
    id: 'trimorphic-awaken', sourceId: 'trimorphic', locator: 'NHC XIII 42:4–46:4',
    keywords: ['sleep', 'wake', 'chains', 'ignorance', 'remember', 'light', 'freedom', 'voice'],
    summary: 'The revealer enters the prison of the rulers, loosens bonds, and calls those sunk in deep sleep to remember the light from which they came.',
    counsel: 'Listen for the voice that increases remembrance and freedom, not the one that deepens fascination with the prison.'
  },
  {
    id: 'trimorphic-return', sourceId: 'trimorphic', locator: 'NHC XIII 46:5–50:24',
    keywords: ['return', 'garment', 'light', 'name', 'five seals', 'completion', 'ascent'],
    summary: 'The final descent clothes the awakened in light and leads them through the Five Seals toward return and completion.',
    counsel: 'Insight seeks embodiment: a new garment means a changed way of being, not a private idea alone.'
  },
  {
    id: 'pistis-fall', sourceId: 'pistis', locator: 'Askew Codex, chapters 29–36',
    keywords: ['sophia', 'false light', 'fall', 'error', 'lion faced power', 'desire', 'deception', 'wisdom'],
    summary: 'Sophia mistakes a reflected, lion-faced light for the higher light she seeks. Desire without discernment draws her downward and her power is consumed.',
    counsel: 'Not every brightness is a guide. Test light by its source and by whether it restores or drains the power to discern.'
  },
  {
    id: 'pistis-repentance', sourceId: 'pistis', locator: 'Askew Codex, chapters 32–62',
    keywords: ['repentance', 'thirteen', 'sophia', 'lament', 'turning', 'perseverance', 'help', 'mercy'],
    summary: 'Sophia turns repeatedly through thirteen repentances. Her return is not a single mood but sustained reorientation, truthful lament, and renewed appeal to the Light.',
    counsel: 'Repentance is repeated turning. Measure it by direction maintained, not emotion displayed once.'
  },
  {
    id: 'pistis-rescue', sourceId: 'pistis', locator: 'Askew Codex, chapters 63–82',
    keywords: ['rescue', 'light power', 'ascent', 'chaos', 'sophia', 'restoration', 'help', 'freedom'],
    summary: 'A light-power is sent to assist Sophia against the powers of chaos. Her own turning and aid from above cooperate in restoration and ascent.',
    counsel: 'Do the turning that belongs to you and receive help without confusing rescue with passivity.'
  }
];

for (const source of sources) {
  source.layer = 'primary';
  source.authority = 'manuscript-witness';
  source.caveat = 'Admitted because its named physical manuscript witness predates 1850. Modern translations are access layers only.';
}

export const allSources = [...sources, ...commentarySources];
export const sourceById = Object.fromEntries(allSources.map((source) => [source.id, source]));
