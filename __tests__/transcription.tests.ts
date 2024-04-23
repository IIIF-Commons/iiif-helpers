import { vttToTranscription, annotationPageToTranscription } from '../src/transcriptions';
import newsPaperOcr from '../fixtures/annotations/newspaper-ocr.json';
import { Vault } from '../src';

describe('transcription helper', () => {
  describe('vtt parsing', () => {
    test('simple vtt parsing', async () => {
      expect(
        await vttToTranscription(
          `WEBVTT - This file has cues.
14
00:01:14.815 --> 00:01:18.114
- What?
- Where are we now?

15
00:01:18.171 --> 00:01:20.991
- This is big bat country.

16
00:01:21.058 --> 00:01:23.868
- [ Bats Screeching ]
- They won't get in your hair. They're after the bugs.    
    `,
          'example-1'
        )
      ).toMatchInlineSnapshot(`
      {
        "id": "example-1",
        "plaintext": "- What?
      - Where are we now?
      - This is big bat country.
      - [ Bats Screeching ]
      - They won't get in your hair. They're after the bugs.",
        "segments": [
          {
            "endRaw": "00:01:18.114",
            "selector": {
              "selector": {
                "temporal": {
                  "endTime": 78.114,
                  "startTime": 74.815,
                },
                "type": "TemporalSelector",
              },
              "selectors": [
                {
                  "temporal": {
                    "endTime": 78.114,
                    "startTime": 74.815,
                  },
                  "type": "TemporalSelector",
                },
              ],
            },
            "startRaw": "00:01:14.815",
            "text": "- What?
      - Where are we now?",
            "textRaw": "- What?
      - Where are we now?",
          },
          {
            "endRaw": "00:01:20.991",
            "selector": {
              "selector": {
                "temporal": {
                  "endTime": 80.991,
                  "startTime": 78.17099999999999,
                },
                "type": "TemporalSelector",
              },
              "selectors": [
                {
                  "temporal": {
                    "endTime": 80.991,
                    "startTime": 78.17099999999999,
                  },
                  "type": "TemporalSelector",
                },
              ],
            },
            "startRaw": "00:01:18.171",
            "text": "- This is big bat country.",
            "textRaw": "- This is big bat country.",
          },
          {
            "endRaw": "00:01:23.868",
            "selector": {
              "selector": {
                "temporal": {
                  "endTime": 83.868,
                  "startTime": 81.05799999999999,
                },
                "type": "TemporalSelector",
              },
              "selectors": [
                {
                  "temporal": {
                    "endTime": 83.868,
                    "startTime": 81.05799999999999,
                  },
                  "type": "TemporalSelector",
                },
              ],
            },
            "startRaw": "00:01:21.058",
            "text": "- [ Bats Screeching ]
      - They won't get in your hair. They're after the bugs.",
            "textRaw": "- [ Bats Screeching ]
      - They won't get in your hair. They're after the bugs.",
          },
        ],
        "source": {
          "format": "text/vtt",
          "id": "example-1",
          "type": "Text",
        },
      }
    `);
    });

    test('vtt with comments', async () => {
      expect(
        await vttToTranscription(
          `WEBVTT - Translation of that film I like

NOTE
This translation was done by Kyle so that
some friends can watch it with their parents.

1
00:02:15.000 --> 00:02:20.000
- Ta en kopp varmt te.
- Det är inte varmt.

2
00:02:20.000 --> 00:02:25.000
- Har en kopp te.
- Det smakar som te.

NOTE This last line may not translate well.

3
00:02:25.000 --> 00:02:30.000
- Ta en kopp`,
          'example-2'
        )
      ).toMatchInlineSnapshot(`
        {
          "id": "example-2",
          "plaintext": "- Ta en kopp varmt te.
        - Det är inte varmt.
        - Har en kopp te.
        - Det smakar som te.
        - Ta en kopp",
          "segments": [
            {
              "endRaw": "00:02:20.000",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 140,
                    "startTime": 135,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 140,
                      "startTime": 135,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:02:15.000",
              "text": "- Ta en kopp varmt te.
        - Det är inte varmt.",
              "textRaw": "- Ta en kopp varmt te.
        - Det är inte varmt.",
            },
            {
              "endRaw": "00:02:25.000",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 145,
                    "startTime": 140,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 145,
                      "startTime": 140,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:02:20.000",
              "text": "- Har en kopp te.
        - Det smakar som te.",
              "textRaw": "- Har en kopp te.
        - Det smakar som te.",
            },
            {
              "endRaw": "00:02:30.000",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 150,
                    "startTime": 145,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 150,
                      "startTime": 145,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:02:25.000",
              "text": "- Ta en kopp",
              "textRaw": "- Ta en kopp",
            },
          ],
          "source": {
            "format": "text/vtt",
            "id": "example-2",
            "type": "Text",
          },
        }
      `);
    });

    test('vtt with styles and strip tags', async () => {
      expect(
        await vttToTranscription(
          `WEBVTT

STYLE
::cue {
  background-image: linear-gradient(to bottom, dimgray, lightgray);
  color: papayawhip;
}
/* Style blocks cannot use blank lines nor "dash dash greater than" */

NOTE comment blocks can be used between style blocks.

STYLE
::cue(b) {
  color: peachpuff;
}

00:00:00.000 --> 00:00:10.000
- Hello <b>world</b>.

NOTE style blocks cannot appear after the first cue.`,
          'example-3'
        )
      ).toMatchInlineSnapshot(`
        {
          "id": "example-3",
          "plaintext": "- Hello world.",
          "segments": [
            {
              "endRaw": "00:00:10.000",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 10,
                    "startTime": 0,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 10,
                      "startTime": 0,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:00.000",
              "text": "- Hello world.",
              "textRaw": "- Hello <b>world</b>.",
            },
          ],
          "source": {
            "format": "text/vtt",
            "id": "example-3",
            "type": "Text",
          },
        }
      `);
    });

    test('vtt with cue settings', async () => {
      expect(
        await vttToTranscription(
          `WEBVTT

00:00:00.000 --> 00:00:04.000 position:10%,line-left align:left size:35%
Where did he go?

00:00:03.000 --> 00:00:06.500 position:90% align:right size:35%
I think he went down this lane.

00:00:04.000 --> 00:00:06.500 position:45%,line-right align:center size:35%
What are you waiting for?`,
          'example-4'
        )
      ).toMatchInlineSnapshot(`
        {
          "id": "example-4",
          "plaintext": "Where did he go?
        I think he went down this lane.
        What are you waiting for?",
          "segments": [
            {
              "endRaw": "00:00:04.000",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 4,
                    "startTime": 0,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 4,
                      "startTime": 0,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:00.000",
              "text": "Where did he go?",
              "textRaw": "Where did he go?",
            },
            {
              "endRaw": "00:00:06.500",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 6.5,
                    "startTime": 3,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 6.5,
                      "startTime": 3,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:03.000",
              "text": "I think he went down this lane.",
              "textRaw": "I think he went down this lane.",
            },
            {
              "endRaw": "00:00:06.500",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 6.5,
                    "startTime": 4,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 6.5,
                      "startTime": 4,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:04.000",
              "text": "What are you waiting for?",
              "textRaw": "What are you waiting for?",
            },
          ],
          "source": {
            "format": "text/vtt",
            "id": "example-4",
            "type": "Text",
          },
        }
      `);
    });
  });

  describe('annotationPageToTranscription', () => {
    test('wellcome example', async () => {
      const vault = new Vault();
      vault.loadSync(newsPaperOcr.id, newsPaperOcr);

      const transcription = await annotationPageToTranscription(vault, newsPaperOcr as any);

      expect(transcription?.plaintext).toMatchInlineSnapshot(`
        "I. 54. Jahrgang
        Nr. 29
        Chef-Redakteur Theodor Wolfi in Berlin, 7
        DB T. W. Mit Bewunderung ſtehen wir vor dem erfreulichen
        men, Wifer einer Staat3anwaltſchaft, die jeht ſogar ihre Nachtruhe
        einnpiert, während ſie in einigen bekannten Fällen ſchon
        mi Tage zu ſchlummern ſchien. Aber nachdem man ge-
        d<hen MWigend bewundert hat, darf man ſich vielleicht für einen
        Fen ugenblid einem anderen Lande zuwenden, in dem die Ge-
        "282, Bhtigfeit blüht. Jn MoS3kau ſind, wie ſchon berichtet
        "geneßurde, vor mehreren Monaten drei junge Männer
        rl rr haftet worden, von denen zwei, Dr. Kindermann
        AUM [nd der Student Wolſc<ht, aus Süddeutſchland gebürtig
        n Zeund, der dritte, ein Student v. Ditmakt, aus Gſthland
        3 ammt. Man iſt wohl nicht berechtigt, ganz über dieſe An-
        Et Flegenheit zu ſchweigen, auch wenn ſie, neben den Affären
        r Barmat, Kutiſker, Bauer und Höfle, manchem ſehr un-
        trächtlich erſcheinen mag. Wer in dieſen Tagen von Moskau
        in. Bricht, tut es in dem tröſtlichen Bewußtſein, daß ſich vorläufig
        bera W Berlin ja doch nicht viel ändern wird. Die parlamentari-
        Unfaren Unterſuchungsausſchüſſe werden noch lange mit ihren
        Kinpchen in hündert Seitengaſſen herumſuchen, die deutſch-
        tionale Tugend wird ſich weiter über das republikaniſche
        "6 ſter empören, und die journaliſtiſchen Schafhirten werden
        anner wieder dafür ſorgen, daß von den für ſie unangenehmen
        Svart Ft ſchichten nichts bis in den Geſichtskreis der gehüteten Herde
        mar> Wingt. Auch draußen in der Welt wird noch eine Weile lang
        ) ohne Mos ſo weitergehen wie biöher. Es wird unermüdlich über
        ee Schulden geſprochen werden, die Frankreich nicht bezahlen
        ann, ill, und über den Sicherheitspakt, der wegen der öſtlichen An-
        Mn 7 ingjel keine Liebe in England findet, und über den Kontroll-
        + SausFricht, den man un3 immer noch vorenthält. Hat es viel
        jiliale Woc>, noch Worte in dieſe Diskuſſionen hineinzugießen, die
        on aus zahlloſen Quellen übereich gewäſſert werden und
        endlich weiterrinnen? ES iſt zum mindeſten ebenſo inter-
        einfach! m, fert
        iberiagant, ſich mit den drei jungen Männern, den zwei Reichs-
        mrn hen und dem Balten, zu beſchäftigen, die ſeit dem Monat
        ſtraße tober in den Händen der allgütigen ruſſiſchen Tſcheka ſind.
        Tiefe drei jungen Männex, der ſchon mit dem Doktortitel
        wuierte dreiundzwanzigjährige Geograph, und die beiden
        = arifudenten, ſind angeblich mit der Abſicht, die Hauptperſonen
        , Sin Sowjetſtaates zu ermorden, nach Moskau gekommen. Sie
        en zwär nicht Paß und Einreiſeerlaubnis, deren Echtheit
        ee ht beſtritten werden kann, aber Einladungsbriefe ruſſiſcher
        15. PWudentenſchaften, auf die ſie ſich beriefen, gefälſcht haben,
        Tage Wd man hat, wie verſichert wird, auch Waffen und die un-
        6 Mbehrlichen Giftfläſchhen bei ihnen entde>t. Die drei ge-
        te en, ſagt die Tſcheka, recht3radikalen Geheimbünden in
        , MaiWutſhland an. Bei ihren Mordplänen hatten ſie es be-
        “ „Mders auf Stalin und Troßki abgeſehen. Uns anderen er-
        men-, ndau Wint es zunächſt ſeltſam, daß rechtsradikale Geheimgruppen,
        3 14531.
        bisher nur politiſche Gegner in Deutſchland niederknallten
        inaſd den Bolſchewismus als beſten Bundesgenoſſen betrachten,
        4 Jdee gefaßt haben ſollten, den heute ziemlich einfluß-
        Offeruſüſn Troßki umzubringen. Wa3 das Gift betrifft, fo iſt von
        1f VoſYk fſtudentiſhen Freunden der Verhafteten in der
        liner Apotheke, die es geliefert hat, feſtgeſtellt worden, daß
        ehlt ftſein Mittel gegen Malaria iſt. Jndeſſen, die Tſcheka erklärt
        -harloi" daß ſie imſtande ſei, all' unſere Zweifel zu zerſtreuen.
        einf beſitt „Dokumente“, die ſie leider nicht zeigt. Nachdem
        * Bongſtvollen Eltern, die deutſchen Amtsſtellen, die ange-
        rus Zifwnſten deutſchen Univerſitätzlehrer und andere Perſonen
        Mme | Monate hindurch vergeblich verſucht hatten, irgendeine
        ße 485, Whricht über das Befinden der Eingekerkerten zu erlangen,
        man in der vorigen Woche dem Rektor der Berliner
        ganteſte Wverſität, Profeſſor Holl, der ſich warmherzig für
        ee Freilaſſung eingeſeßt hatte, einen Brief des
        -g 5140. WW. Kindermann überbracht. Kindermann ſagt in
        yer, Wem Briefe, „die durch G. P. U. unternommenen Nach-
        6 (Mh ungen“ hätten ergeben, daß ſeine beiden Reiſekameraden
        et, Miher in Deutſchland in faſciſtiſchen «Kreiſen ſich betätigt
        En en“, und „daß ihre Reiſeabſichten andre als wiſſenſchaft-
        | 1]
        raße M: geweſen ſeien. Er ſelbſt habe davon nichts gewußt und
        e fich „während der Unterſuchung von der Objektivität
        tklaffiz. MW Unterſuchungsorgane überzeugt“. Er habe zu dieſen Or-
        EEE en „vollkommenes Vertrauen“. Der Verhaftete bittet de8halb
        <tenbefohl den Rektor wie die deutſche Regierung, nicht3 weiter in
        ausbeſſ/W Sache zu unternehmen, und er fügt beruhigend hinzu, die
        vſtraße 1! jandlung, die ihm zuteil werde, ſei „aufmerkſam, zuvor-
        eimufanend und korrekt". . . „Von den Schre>en, über die man
        ße 19 Weutſchland ſpricht, habe ich in der Zeit meiner Verhaftung
        trbeit. Wb. P. U. nichts bemerken können." Am Schluſſe verſichert
        33. Briefſchreiber, er gebe „dieſe Erklärungen aus freiem
        Tag Wen und freier Jnitiative“ ab, und „ohne jeden Zwang“.
        be M. zu ſich ja jeder das Seinige denken kann. .
        * wide Verwandten, die Lehrer und Freunde der jungen
        m Kine werden die Erzählungen, die nun von der „Jſtweſtia
        Heider Wroitet und in die Welt hinausgeſchikt werden, mit
        Ei ielleiht immer noh
        fer Ueberraſchung leſen und vielleich 3 )
        228 feln, obgleih natürlih au< ſie der bewährten
        ante Wfa das allergrößte Bertrauen entgegenbringen.
        reiſen. Mn biaher hatten ſie ſich von dem Weſen, den
        hrung "Wen und Anſchauungen beſonders des Kindermann und des
        aſtr. %Wiſcht ein 208 anderes Bild gemacht. I< habe
        är; drei eines Tages kennen gelernt, als ſie, mit den Empfeh
        n. Hanſen hervorragender Profeſſoven, linksſtehender und rechts-
        fertig" Wender, ausgerüſtet und ſchon mit allen Päſſen, Scheinen
        168 7388. d Einladungen verſehen, bei mir vorſprachen und, gleich
        “Str. Men anderen, fragten, 'ob Reiſeberichte willkommen ſeien.
        ſuchten ſie, offenbar hier und dort anpochend -- auch bei
        duſtriefirmen, was man ihnen jeßt in Mozkau als „Handels
        reiswert. Berliner und Handels-Zeitung
        Die Verhaftungen in Moskau,.
        PEET Rg R RRgRRRgRgpRpPpPr ry yr rT NR
        Abend-Ausgabe Tageblatt Einzel-Nummer 10 Pfennig.
        Prentice debbie
        Montag. 16. Februar 19235
        Druck und Verlaa von Ru doi Moſſe in Berlin."
        die eingekerkerten jungen Deutſchen.
        Bas. die Tſcheka behauptet.
        Celegramm unſere8 Korretyrondenten.)
        dü.) Moskau, 15. Februar.
        Anknüpfend an eine bevorſtehende Interpellation der Sozial-
        demofkraten im Reichstag über die Gefangenhaltung der drei
        jungen Deutſchen in Moskau und andere deutſche Gefangene, die aus
        politiſchen Gründen in ruſſiſchen Gefängniſſen feſtgehalten würden,
        ſchreibt die „Jsweſtija“, dieſe Interpellation ſei durch die Or-
        ganiſation Conſul vorbereitet (!!), die durch Finanz-
        und Handelsfreiſe auf die Sozialdemokraten eingewirkt habe. Die
        „Jsweſtija“ beklagt ſich weiter über die Kampagne der deutſchen
        Blätter, welche die Beziehungen zu Sowjetrußland verſchlechtern
        ſolle, und fährt dann fort: „Wir ſind in der Lage, an Hand un-
        beſtreitbarer Dokumente, die der Sowjetregierung zur Verfügung
        ſtehen, nachzuweiſen, daß dieſe „jungen Gelehrten Fälſcher von
        Dokumenten und Spione ſind, die eine deutſche
        faſciſtiſche Organiſation zu terroriſtiſchen
        Zwecken nach Moskau abkommandierte . . . .“ „Die Or-
        ganiſation „Conſul“ hat - bereits 1923 beſchloſſen,
        ihre terroriſtiſche Tätigkeit auszudehnen und einen Plan
        ausgearbeitet für Attentate auf hervorragende kommuniſtiſche
        Staatsmänner in. Mos8kau. Im Dezember 1923 wurde eine
        Gruppe Karl Kindermann8 mit der Ausführung
        des Planes auf ruſſiſchem Boden beauftragt. Im Juli 1924 hatte ſie
        ſchon ganz beſtimmte Anweiſungen erhalten, deren erſte Opfer
        ſowjetruſſiſche Staat8männer in MoSkau ſein
        ſollten. Die „Jsweſtija“ behauptet, daß zur Maxsfierung ihrer
        Abſichten die jekt Verhafteten fich an die Kommuniſtiſche Partei
        heranmachten,“ uur in- die ton muniſtiſchen Kreiſe Moskaus einzu
        dringen. Sie fälſchten die Mitgliedskarten (Warum? Sie konnten
        ja ec<hte haben. D. Red.) und Beglaubigungskarten, wandten ſich
        an liberale Gelehrte Deutſchlands, „deren Empfehlungsſchreiben
        ihnen auch die Tür zum Arbeitszimmer Theodor Wolffs
        öffneten, der ſich einverſtanden erklärte, Korreſpondenzen aus Fern-
        Sibirien entgegenzunehmen, und einen Vorſchuß von 2000 Mark
        bewilligte“, Weiter wandten fich die Reiſenden an den Michael-
        Konzern und an das Modehaus Rudolf Herkog, die dafür Wirt-
        fſchafts8ſpionage (!) zu ihren Gunſten forderten. Veber die
        Perſonalien ſagte der Artikel: Dr. Karl Kindermann ſtudierte
        1922/23 Kriminalrecht, vervollſtändigte ſeine theoretiſchen Kenntniſſe
        im Dienſte eine8 Detektivbureaus in Berlin. Einige Beamte des
        Berliner Polizeipräſidiums können ausführlicher über ihn Auskunft
        geben. Max v. Ditmaringen, alias Ditmar, iſt Eſtländer und
        von der Organiſation „Conſul“ mit Terrorakten beauftragt. Der
        Artikel ſchließt mit der Hoffnung, daß die öffentliche Meinung aller
        Kreiſe in Deutſchland jeßt ihren Jrrtum einſehen, die Regierung die
        „Verleumder“ zum Schweigen bringen werde. Die im Reichstag
        geplante Interpellation verlange, wenigſtens nach ihrem Wortlaut,
        daß die deutſche Regierung die Befreiung der ge-
        fangengehaltenen Deutſc<en, ſofern es ſich nicht um
        ganz gewöhnliche Verbrecher handle, „in entſprechender Weiſe durch-
        jehen“" ſolle. Die Juterpellation ſei wohl kaum überlegt. Würde
        es in Deutſchland verſtanden werden, wenn die Sowjet-
        regierung von der deutſchen Regierung verlangte, daß ſie
        Sowjetſtaat8angehörige in Deutſchland gleichfalls freiließe, ledigvich
        weil ſie „nicht gewöhnliche Verbrecher ſind“? Jv Deutſchland
        ſive eine Anzahl Sowjetſtaatsangehöriger wegen politiſcher Ver-
        brechen, ohne daß bi8her eine Intervention der Sowjetregierung er
        folgt wäre. Die deutſche juriſtiſche Poſition werde durch derartige
        Forderungen gegenüber Sowjetrußland nur geſchwächt. Soweit
        die „I3weſtia“. WaZ3 die drei jungen Deutſ<en angeht, jo
        liegt eine amtliche öffentliche Mitteilung der Sowjetbehörden
        über ihren Fall immer noh nicht vor.“ Es iſt ſehr zu wünſchen,
        daß dis Unterſuchung möglichſt ſchnell beendigt wird und
        dann eine völlig öffentliche Gerichtsverhandlung
        folgt, falls das Endergebnis der gegenwärtigen Unterſuchung zur
        Anklageerhebfwmig führt, v detechider etileheiigl
        Auch die neue Darſtellung der „Jsweſtija" hat, wie wir durch
        Umfrage feſtgeſtellt haben, in dem Kreiſe derjenigen, die mit
        Dr. Kindermann und Wolſcht bekannt oder befreundet ſind, die
        Ueberzeugung von der Unſchuld der Verhafteten nicht erſchüttert,
        Wir verweiſen auf den nebenſtehenden Leitartifel,
        GELN HTE REET VAE WETRIRK RE BEOREFUHRER SP WIS VERENA WTERGO 7 MORE EEREES CHF BREE HRRRSIN SDIRUN BETE HNESE EN SOGEN ÖIPEI E HRRGSNEING EISERNEN WEN“ GE EFRON REIE IE EEN EEE WR UET IREN NCE IUEIS ORE HRR HRN BEE
        ſpionage" auslegt -- ihre magere Reiſekaſſe aufzufüllen. Jh
        machte ihnen klar, daß wir kundigere Mitarbeiter hätten und
        für eine Berichterſtattung über die verwickelten wirtſchaft-
        lichen und politiſchen Probleme Sowjetrußland8 unerfahrene
        Forſchungsreiſende nicht brauchten, und hielt ihnen, wie gewiß
        jeder Befragte, die Schwierigkeiten des Unternehmen3 vor.
        Wir kamen überein, daß ſie einiges über das Leben der Stu-
        denten an ſibiriſchen Univerſitäten ſchreiben ſollten, von denen,
        wie ihre Papiere bewieſen, eine Einladung an ſie ergangen
        war. Nicht nur ihre von den ausgezeichneten Gelehrten ver-
        faßten Geleitbriefe, ſondern mehr noch ihre Friſche und ſogar
        ihre mit junger Gelehrſamkeit vereinte etwas naive Aben-
        teuerluſt konnten ſympathiſch ſtimmen. Ein politiſches
        Bekenntnis wurde ihnen nicht abverlangt, und es
        wurde nur geſagt, daß ſie vermeiden müßten, ſich
        auf das Gebiet der Politik zu verirren. Nicht zu
        verkennen war, daß Kindermann und Wolſcht als Freunde
        auftraten, während zwiſchen ihnen und dem Balten v. Ditmar
        ein weniger intimes Verhältnis beſtand. Die beiden Deutſchen
        zeigten in der Unterhaltung, daß der Balte nur den Dolmetſch
        ſpielen ſolle, und hielten Diſtanz. Der Eindruck, den man bei
        flüchtiger Begegnung empfängt, kann folbſtverſtändlich trügen
        und darum habe ich verſucht, zuverläſſigere Auskünfte über
        die drei zu erlangen. Von dem Ditmar, der ein gutmütiges
        rundes Geſicht hatte, weiß man auch in den ſtudentiſchen Kreiſen
        nur zu ſagen, daß er ſich bald nach rechts, bald nach links, zu-
        leßt anſcheinend nach linf8, hat treiben laſſen und wahrſchein-
        lich mehr phantaſiert als gegeſſen hat. Für den Dr. Kinder-
        mann, der nach allen Zeugniſſen ſich mit den CE en
        Theorien befreundet zu haben ſcheint hat ſein ſchwer leiden-
        der Vater, ein Kaufmann in Durlach, ſchon mit leidenſchaft-
        lichen Worten an die Oeffentlichkeit appelliert. Ein ausge-
        zeichneter Univerſitätslehrer, Profeſſor in Tübingen, hat mir
        geſchrieben: „Dr. Kindermann iſt zweifellos nicht als Gegner
        nach Moskau gefahren, ſondern hat ſicherlich die ruſſiſchen
        Verhältniſſe weit eher in etwas illuſionärem Lichte geſehen.“
        Der Student Wolſcht iſt, wie ſeine Freunde ausſagen, gleich-
        falls von der rechten Seite nach links hinübergegangen, und
        mit ſo großer Entſchiedenheit, daß er, troß drücender Be-
        dürftigkeit, freiwillig eine Unterſtüßung zurü>wies, die er bis
        dahin von einem ihn zu reaktionär dünkenden Gönner erhielt.
        Statt weiterer Bekundungen will ich, mit einigen Kürzungen,
        die Schilderung hierher ſeen, die mir ſein Vater, ein in Bop-
        pard lebender ehemaliger Gymnaſialprofeſſor, entwirft:
        „Herzlichen Dank für Jhr Freundliches Schreiben, das mir
        68jährigem Mann ungemein wohlgetan hat. Was nun die hFe-
        wünſchten Aufflärungen über Theo angeht, ſo hängen dieſe mit
        meiner eigenen Stellung zur Kirche und zum Staate eng zu-
        ſammen. JH bin Anhänger der darwiniſtiſchen Theorie. Jn
        politiſcher Hinſicht bin ih Staat3ſozialiſt, wenn ich auch
        weder der ſozialdemokratiſchen noch kommuniſtſhen Partei ange-
        höre; ich dürfte ungefähr der Richtung de? „Berliner Tageblattes“"
        anzugliedern ſein, obwohl ich mich von jeder aktiven politiſchen
        Beteiligung biöher vollſtändig ferngehalten habe und ſeit meiner
        vor 17 Jahren nachgeſuchten und erhaltenen Penſionierung nur
        den Wiſſenſchaften gelebt habe. Jm übrigen tolerant
        laſſe ich jeden nach jeiner Manier ſelig werden. Sie werden es
        alfo verſtehen, daß ich meinem Sohn bei feinem im September
        vorigen Jahres erfolgten Beſuch keine Schwierigkeiten in den Weg
        gelegt habe, als er mir geſtand, daß er zur kommuni ſtiſchen
        Partei übergegangen ſei. Wer nicht rechts gehen kann,
        mag links gehen. Der Verluſt ſeines Vermögens durch die IJnfla1-
        tion, die ihn nötigte, ſich ſelbſt durchzuſchlagen, mag wohl nebſt
        der Bekanntſchaft mit zahlreichen ruſſiſchen und deutſchen Kom-
        muniſten die Hauptveranlaſſung dazu geweſen ſein. Außerdem
        hat ihn eine Nede des früheren Rektors der Univerſität erbittert,
        der öffentlich erklärte, er wolle keine Werkſtudenten haben. Aus
        allen dieſen Gründen hat Theo mit ſeinen früheren Anſchauungen
        gebrochen und ſogar, wie er mir erzählte, in kommuniſti-
        ſchen Kreiſen in Berlin einen Vortrag über E ntwi>klu ng
        des Sozialismus gehalten. Wenn Theo ſeine offizielle An-
        meldung bei der kommuniſtiſchen Partei, Wm ſeine Einſchrei-
        bung als Mitglied verſäumt hat, ſo iſt dies wohl hauptſächlieh der
        Bummelei zuzuſchreiben; daß er fich nicht angemeldet haben ſoll,
        wundert mich übrigens.
        1922 war Theo mit meiner Zuſtimmung auf Veranlaſſung ſeines
        ehemaligen Prinzipals (Theo hat vor dem <emiſchen Studium einen
        praktiſchen Kurſus auf einem Rittergut in einer Brennerei durch»
        gemacht, war auch ein Jahr als Tiſchlerlehrling bei einem
        Meiſter in Heſſiſch-Oldendorf, da ich hn urſprünglich für das Vau-
        fach beſtimmt hatte. Schon dieſe Art der Vorbildung hat ſicher auf
        feine kommuniſtiſche Geſinnung und Arbeiterfreundlichkeit Ein-
        fluß gehabt) bei einer ſchlagenden Verbindung eingetreten, hat einige
        Menſuren ausgefochten und hat ſich vollſtändig anderen Kreiſen zu-
        gewendet. Aus Mangel an Mitteln hat er wochenlang im Studenten-
        heim faſt nur von troFenem Brot gelebt in bitterſter Armut,
        da ich damals in der Inflation8periode nicht imſtande war, ihn zu
        unterſtüßen, weil ich z. B. in einem Monat (1923) ſage und ſchreibe
        10 Pf. Penſion erhielt, ſo ſehr war das Geld entwertet, als es in
        meine Hände kam. Theo hat mit ſeinen Kameraden ſein leßtes3
        Stü> Brot geteilt; er war außerordentlich beliebt und eine
        biedere, allzu gutmütige Seele. Sein Hauptfehler iſt Mangel an
        Vorſicht. Im übrigen iſt er eine praktiſche Natur. Mit ſeinem
        mehr wiſſenſchaftlich veranlagten Freunde Kindermann hat er ge-
        meinſchaftlich das Neiſeprojekt entworfen, von dem er ſich durch Film-
        aufnahmen günſtige pekuniäre Reſultate verſprach. Hauptgrund aber
        war bei beiden ein ungezügelter Reiſetrieb und Abenteuerluſt.
        Beiden fehlte die nötige Erfahrung und Kenntnis der Zuſtände
        in Rußland.
        Kap Tſcheljuſkin und das vulkaniſche Kamtſchatka hat ſie be-
        onders angeloc>t. Die Tſcheka hat dieſe Angaben zu der Anklage
        benußt, daß ſie Mitglieder der Orgeſch ſeien, die mit Weißgardiſten
        in Verbindung ſtänden. Bekanntlich haben vor einiger Zeit in
        Kamtſchatka erbitterte Kämpfe zwiſchen Weißgardiſten und der
        Roten Armee ſtatgefunden. Doch davon hatten die beiden harm-
        loſen Studenten gar keine Ahnung. Daß Theo größere Kenntnis
        von den Plänen Ditmars gehabt habe als Kindermann iſt Un-
        ſinn. Theo und Ditmar ſtanden, wie Vater Kindermann
        ſchreibt, wie Hund und Kaß. An Ditmars Schuld glaube
        ich niht. Für die Wahrheit der von mir über Theo gemachten
        Angaben ſtehe ich unbedingt ein."
      `);

      expect(transcription?.segments).toHaveLength(304);

      expect(transcription?.segments[0]).toMatchInlineSnapshot(`
        {
          "granularity": "line",
          "selector": {
            "selector": {
              "spatial": {
                "height": 53,
                "unit": "pixel",
                "width": 399,
                "x": 0,
                "y": 376,
              },
              "type": "BoxSelector",
            },
            "selectors": [
              {
                "spatial": {
                  "height": 53,
                  "unit": "pixel",
                  "width": 399,
                  "x": 0,
                  "y": 376,
                },
                "type": "BoxSelector",
              },
            ],
            "source": {
              "id": "https://iiif.io/api/cookbook/recipe/0068-newspaper/canvas/p1",
              "partOf": [
                {
                  "id": "https://iiif.io/api/cookbook/recipe/0068-newspaper/newspaper_issue_1-manifest.json",
                  "type": "Manifest",
                },
              ],
              "type": "Canvas",
            },
            "type": "SpecificResource",
          },
          "text": "I. 54. Jahrgang
        ",
          "textRaw": "I. 54. Jahrgang",
        }
      `);
    });
  });
});
