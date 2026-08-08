import { vttToTranscription, annotationPageToTranscription } from "../src/transcriptions";
import newsPaperOcr from "../fixtures/annotations/newspaper-ocr.json";
import { Vault } from "../src";

describe("transcription helper", () => {
  describe("vtt parsing", () => {
    test("cookbook vtt parsing", async () => {
      expect(
        await vttToTranscription(
          `"WEBVTT\r\n\r\n1\r\n00:00:01.200 --> 00:00:21.000\r\n[music]\r\n\r\n2\r\n00:00:22.200 --> 00:00:26.600\r\nJust before lunch one day, a puppet show \r\nwas put on at school.\r\n\r\n3\r\n00:00:26.700 --> 00:00:31.500\r\nIt was called \"Mister Bungle Goes to Lunch\".\r\n\r\n4\r\n00:00:31.600 --> 00:00:34.500\r\nIt was fun to watch.\r\n\r\n5\r\n00:00:36.100 --> 00:00:41.300\r\nIn the puppet show, Mr. Bungle came to the \r\nboys' room on his way to lunch.\r\n\r\n6\r\n00:00:41.400 --> 00:00:46.200\r\nHe looked at his hands. His hands were dirty \r\nand his hair was messy.\r\n\r\n7\r\n00:00:46.300 --> 00:00:51.100\r\nBut Mr. Bungle didn't stop to wash his hands \r\nor comb his hair.\r\n\r\n8\r\n00:00:51.200 --> 00:00:54.900\r\nHe went right to lunch.\r\n\r\n9\r\n00:00:57.900 --> 00:01:05.700\r\nThen, instead of getting into line at the \r\nlunchroom, Mr. Bungle pushed everyone aside \r\nand went right to the front.\r\n\r\n10\r\n00:01:06.000 --> 00:01:11.800\r\nEven though this made the children laugh, \r\nno one thought that was a fair thing to do.\r\n\r\n11\r\n00:01:11.900 --> 00:01:22.000\r\nThen, in the lunchroom, Mr. Bungle was so \r\nclumsy and impolite that he knocked over \r\neverything. And no one wanted to sit next \r\nto him.\r\n\r\n12\r\n00:01:23.500 --> 00:01:29.000\r\nAnd when he finally knocked his own tray \r\noff the table, that was the end of the puppet \r\nshow.\r\n\r\n13\r\n00:01:30.300 --> 00:01:36.300\r\nThe children knew that even though Mr. Bungle \r\nwas funny to watch, he wouldn't be much fun \r\nto eat with.\r\n\r\n14\r\n00:01:36.400 --> 00:01:42.500\r\nPhil knew that a Mr. Bungle wouldn't have \r\nmany friends. He wouldn't want to be like \r\nMr. Bungle.\r\n\r\n15\r\n00:01:43.900 --> 00:01:49.100\r\nLater Miss Brown said it was time to for \r\nthe children who ate in the cafeteria to \r\ngo to lunch.\r\n\r\n16\r\n00:01:49.200 --> 00:01:52.500\r\nShe hoped there weren't any Mr. Bungles in \r\nthis room.\r\n\r\n17\r\n00:01:58.500 --> 00:02:03.200\r\nPhil stopped to return a book to Miss Brown \r\nwhile his friends went on to the lunchroom.\r\n\r\n18\r\n00:02:03.700 --> 00:02:05.400\r\nHe would have to catch up with them later.\r\n\r\n19\r\n00:02:08.500 --> 00:02:13.000\r\nOne his way to catch up with his friends, \r\nPhil almost walked passed the boys' room.\r\n\r\n20\r\n00:02:13.300 --> 00:02:16.400\r\nBut he stopped and thought we're his hands \r\nclean?\r\n\r\n21\r\n00:02:16.500 --> 00:02:22.800\r\nNo, they were a little dirty. Phil remembered \r\nthat Mr. Bungle didn't wash his hands.\r\n\r\n22\r\n00:02:22.900 --> 00:02:25.600\r\nMr. Bungle's hair was messy too.\r\n\r\n23\r\n00:02:25.800 --> 00:02:28.000\r\nPhil didn't want to be like Mr. Bungle.\r\n\r\n24\r\n00:02:31.200 --> 00:02:36.900\r\nInside the boys' room, Phil was surprised \r\nto see some of his friends washing their \r\nhands too.\r\n\r\n25\r\n00:02:37.300 --> 00:02:40.900\r\nPhil washed his hands well with lots of soap.\r\n\r\n26\r\n00:02:45.400 --> 00:02:47.800\r\nThen he rinsed the soap off.\r\n\r\n27\r\n00:02:51.700 --> 00:02:58.900\r\nPhil dried his hands well too. When he was \r\nfinished, he threw the paper towel in the \r\nbasket where it belonged.\r\n\r\n28\r\n00:02:59.700 --> 00:03:02.200\r\nAnd then he made sure that his hair looked \r\nneat.\r\n\r\n29\r\n00:03:05.500 --> 00:03:08.500\r\nNow Phil and his friends were ready for lunch.\r\n\r\n30\r\n00:03:17.600 --> 00:03:22.300\r\nThere was a line of children waiting to get \r\ninto the lunchroom when Phil got there.\r\n\r\n31\r\n00:03:22.800 --> 00:03:25.100\r\nHe saw some boys he knew at the front of \r\nthe line.\r\n\r\n32\r\n00:03:25.500 --> 00:03:28.600\r\nThey waved for him to go up to the front \r\nwith them.\r\n\r\n33\r\n00:03:29.600 --> 00:03:33.100\r\nBut Phil didn't want to break into line as \r\nMr. Bungle did.\r\n\r\n34\r\n00:03:34.300 --> 00:03:38.500\r\nSo Phil went to the end. That was the fair \r\nthing to do.\r\n\r\n35\r\n00:03:38.600 --> 00:03:41.500\r\nHe would see his other friends inside the \r\nlunchroom.\r\n\r\n36\r\n00:03:42.600 --> 00:03:46.500\r\nThe line moved very fast, and soon Phil was \r\ninside.\r\n\r\n37\r\n00:03:47.600 --> 00:03:49.200\r\nFirst he picked up his tray.\r\n\r\n38\r\n00:03:55.400 --> 00:03:57.300\r\nThen he got his silverware.\r\n\r\n39\r\n00:03:59.500 --> 00:04:04.300\r\nHe put his knife, fork and spoon neatly on \r\nthe tray.\r\n\r\n40\r\n00:04:05.000 --> 00:04:07.500\r\nAnd then he slid his tray along.\r\n\r\n41\r\n00:04:11.900 --> 00:04:15.300\r\nHe always enjoyed looking at the good food \r\nin the cafeteria.\r\n\r\n42\r\n00:04:15.400 --> 00:04:18.200\r\nIt tasted good and was good for him too.\r\n\r\n43\r\n00:04:18.900 --> 00:04:23.200\r\nInstead of having a sandwich today, Phil \r\ndecided to take the hot lunch.\r\n\r\n44\r\n00:04:26.100 --> 00:04:28.300\r\nPhil took some bread and butter too.\r\n\r\n45\r\n00:04:28.500 --> 00:04:31.600\r\nAnd he knew what else he wanted: milk.\r\n\r\n46\r\n00:04:31.700 --> 00:04:35.600\r\nBut Alice took the last carton on the tray.\r\n\r\n47\r\n00:04:35.700 --> 00:04:40.600\r\nMaybe there was more more milk, so he said, \r\n\"May I please have some milk?\"\r\n\r\n48\r\n00:04:41.100 --> 00:04:45.800\r\nPhil remembered to say \"may I\" and \"please\". \r\nThat was very polite.\r\n\r\n49\r\n00:04:45.900 --> 00:04:48.200\r\nYes, there was more milk.\r\n\r\n50\r\n00:04:51.800 --> 00:04:55.500\r\nPhil remembered to say \"thank you\" when he \r\ntook the carton of milk.\r\n\r\n51\r\n00:04:56.700 --> 00:05:01.000\r\nPhil had good manners. He didn't want to \r\nbe like Mr. Bungle in the lunchroom.\r\n\r\n52\r\n00:05:01.500 --> 00:05:04.400\r\nPhil didn't want to forget his dessert.\r\n\r\n53\r\n00:05:05.100 --> 00:05:08.200\r\nThe cake looked delicious [and was huge!].\r\n\r\n54\r\n00:05:10.600 --> 00:05:15.300\r\nAt the end of the line, the lunchroom supervisor \r\nsaid she had noticed how polite Phil was.\r\n\r\n55\r\n00:05:15.400 --> 00:05:17.000\r\nAnd she smiled at him.\r\n\r\n56\r\n00:05:17.100 --> 00:05:19.400\r\nShe wouldn't smile at a Mr. Bungle.\r\n\r\n57\r\n00:05:20.000 --> 00:05:22.600\r\nPhil went to table where his friends were.\r\n\r\n58\r\n00:05:23.500 --> 00:05:29.700\r\nHe put his tray down carefully, pulled out \r\nhis chair quietly and sat down.\r\n\r\n59\r\n00:05:30.100 --> 00:05:33.600\r\nHe knew his friends would like a noisy Mr. \r\nBungle at their table.\r\n\r\n60\r\n00:05:33.800 --> 00:05:36.900\r\nThere was someone Phil liked: Freddy.\r\n\r\n61\r\n00:05:37.400 --> 00:05:39.700\r\nHe always brought his lunch from home.\r\n\r\n62\r\n00:05:39.800 --> 00:05:40.700\r\nIt looked good.\r\n\r\n63\r\n00:05:41.600 --> 00:05:45.000\r\nFreddy had a sandwich, and apple, a cookie, \r\nand milk.\r\n\r\n64\r\n00:05:48.300 --> 00:05:52.100\r\nBefore Phil began to eat, he always put a \r\nnapkin on his lap.\r\n\r\n65\r\n00:05:52.400 --> 00:05:53.900\r\nSo did Freddy.\r\n\r\n66\r\n00:05:55.100 --> 00:05:58.300\r\nEveryone liked Freddy. He was very polite.\r\n\r\n67\r\n00:05:58.400 --> 00:06:01.900\r\nFor example, if he had food in his mouth \r\nwhen someone talked to him,\r\n\r\n68\r\n00:06:02.000 --> 00:06:07.200\r\nhe always took time to chew the food with \r\nhis mouth closed and swallow before he answered.\r\n\r\n69\r\n00:06:08.900 --> 00:06:12.800\r\nPhil noticed how straight and tall Freddy \r\nusually sat.\r\n\r\n70\r\n00:06:12.900 --> 00:06:15.600\r\nFreddy kept his feet on the floor too.\r\n\r\n71\r\n00:06:18.200 --> 00:06:21.500\r\nPhil would rather be like Freddy than like \r\nMr. Bungle.\r\n\r\n72\r\n00:06:21.600 --> 00:06:25.400\r\nAnother polite person everyone liked was \r\nAlice.\r\n\r\n73\r\n00:06:26.700 --> 00:06:33.200\r\nFor example, when Alice sneezed, she covered \r\nher mouth and nose. This protected her friends \r\nat the table from any germs.\r\n\r\n74\r\n00:06:34.500 --> 00:06:38.000\r\nWhile Phil and his friends ate, a boy ran \r\npast their table.\r\n\r\n75\r\n00:06:38.100 --> 00:06:42.300\r\nYou shouldn't run in the lunchroom. Only \r\nMr. Bungle would do that.\r\n\r\n76\r\n00:06:45.800 --> 00:06:49.400\r\nPhil and his friends wouldn't like to have \r\na Mr. Bungle at their table.\r\n\r\n77\r\n00:06:49.600 --> 00:06:52.400\r\nThen lunchtime wouldn't be as much fun as \r\nit is.\r\n\r\n78\r\n00:06:53.500 --> 00:06:56.100\r\nPhil ate slowly and enjoyed his lunch.\r\n\r\n79\r\n00:06:57.500 --> 00:07:00.400\r\nFinally, he had eaten everything except his \r\ndessert.\r\n\r\n80\r\n00:07:01.000 --> 00:07:03.800\r\nHe saved his cake for last.\r\n\r\n81\r\n00:07:03.900 --> 00:07:07.900\r\nOnly a Mr. Bungle would eat his dessert before \r\nhe'd finished the rest of his lunch.\r\n\r\n82\r\n00:07:08.200 --> 00:07:10.200\r\nAnd Phil wan't a Mr. Bungle.\r\n\r\n83\r\n00:07:11.600 --> 00:07:13.000\r\nThe cake was a lie.\r\n\r\n84\r\n00:07:16.800 --> 00:07:18.300\r\nPhil drank his milk carefully.\r\n\r\n85\r\n00:07:18.800 --> 00:07:22.200\r\nSome children are messy when they drink milk, \r\nbut not Phil.\r\n\r\n86\r\n00:07:24.600 --> 00:07:30.500\r\nAs each of Phil's friends finished, they \r\ndidn't leave the table but waited for all \r\nthe others to finish eating too.\r\n\r\n87\r\n00:07:31.800 --> 00:07:34.500\r\nPhil was the last one done.\r\n\r\n88\r\n00:07:34.600 --> 00:07:37.500\r\nHis wiped his mouth and hands carefully with \r\nhis napkin.\r\n\r\n89\r\n00:07:38.500 --> 00:07:40.500\r\nThen he cleaned the table where he sat.\r\n\r\n90\r\n00:07:41.200 --> 00:07:43.700\r\nHe didn't want to leave his place at the \r\ntable dirty.\r\n\r\n91\r\n00:07:44.800 --> 00:07:52.500\r\nEveryone at the table cleaned his own place \r\nwell. But look at that table. It was left \r\nvery messy.\r\n\r\n92\r\n00:07:53.900 --> 00:07:56.500\r\nPhil thought a Mr. Bungle must have sat there.\r\n\r\n93\r\n00:07:58.200 --> 00:08:04.500\r\nBut Phil didn't want to be like Mr. Bungle \r\nso he put his chair neatly into place.\r\n\r\n94\r\n00:08:05.500 --> 00:08:08.600\r\nAnd his table looked fine.\r\n\r\n95\r\n00:08:09.100 --> 00:08:12.500\r\nNot a piece of paper or scrap of food was \r\nleft on it.\r\n\r\n96\r\n00:08:17.000 --> 00:08:19.500\r\nNo Mr. Bungle sat here!\r\n\r\n97\r\n00:08:21.100 --> 00:08:26.400\r\nPhil's friends were careful to put their \r\nwaste papers and empty milk cartons where \r\nthey belonged.\r\n\r\n98\r\n00:08:27.300 --> 00:08:31.600\r\nIn this way, they helped keep the lunchroom \r\nclean.\r\n\r\n99\r\n00:08:31.900 --> 00:08:37.700\r\nPhil was certain that Mr. Bungle wouldn't \r\nput his paper in the waste basket and his \r\nempty carton on the milk tray.\r\n\r\n100\r\n00:08:38.300 --> 00:08:42.600\r\nMr. Bungle probably wouldn't bother to put \r\nhis lunch tray in the right place either.\r\n\r\n101\r\n00:08:42.700 --> 00:08:47.500\r\nBut Phil and his friends did.\r\n\r\n102\r\n00:08:47.600 --> 00:08:53.500\r\nLunch was good today. And then Miss Brown \r\ntold Phil and his friends how proud she was \r\nof them.\r\n\r\n103\r\n00:08:54.000 --> 00:08:57.300\r\nThey had left their table the neatest in \r\nthe luchroom.\r\n\r\n104\r\n00:08:57.400 --> 00:09:02.200\r\nNo one here was a Mr. Bungle. And no one \r\nwanted to be.\r\n\r\n105\r\n00:09:02.800 --> 00:09:09.200\r\nAre you like Mr. Bungle? Mr. Bungle is ashamed \r\nbecause he spoils lunchtime.\r\n\r\n106\r\n00:09:10.500 --> 00:09:12.000\r\nDon't be like Mr. Bungle.\r\n\r\n107\r\n00:09:12.100 --> 00:09:17.600\r\nHave good lunchtime manners and lunch will \r\nbe more fun for everyone.\r\n\r\n"`,
          "example-2"
        )
      ).toMatchInlineSnapshot(`
        {
          "id": "example-2",
          "plaintext": "[music]
        Just before lunch one day, a puppet show 
        was put on at school.
        It was called "Mister Bungle Goes to Lunch".
        It was fun to watch.
        In the puppet show, Mr. Bungle came to the 
        boys' room on his way to lunch.
        He looked at his hands. His hands were dirty 
        and his hair was messy.
        But Mr. Bungle didn't stop to wash his hands 
        or comb his hair.
        He went right to lunch.
        Then, instead of getting into line at the 
        lunchroom, Mr. Bungle pushed everyone aside 
        and went right to the front.
        Even though this made the children laugh, 
        no one thought that was a fair thing to do.
        Then, in the lunchroom, Mr. Bungle was so 
        clumsy and impolite that he knocked over 
        everything. And no one wanted to sit next 
        to him.
        And when he finally knocked his own tray 
        off the table, that was the end of the puppet 
        show.
        The children knew that even though Mr. Bungle 
        was funny to watch, he wouldn't be much fun 
        to eat with.
        Phil knew that a Mr. Bungle wouldn't have 
        many friends. He wouldn't want to be like 
        Mr. Bungle.
        Later Miss Brown said it was time to for 
        the children who ate in the cafeteria to 
        go to lunch.
        She hoped there weren't any Mr. Bungles in 
        this room.
        Phil stopped to return a book to Miss Brown 
        while his friends went on to the lunchroom.
        He would have to catch up with them later.
        One his way to catch up with his friends, 
        Phil almost walked passed the boys' room.
        But he stopped and thought we're his hands 
        clean?
        No, they were a little dirty. Phil remembered 
        that Mr. Bungle didn't wash his hands.
        Mr. Bungle's hair was messy too.
        Phil didn't want to be like Mr. Bungle.
        Inside the boys' room, Phil was surprised 
        to see some of his friends washing their 
        hands too.
        Phil washed his hands well with lots of soap.
        Then he rinsed the soap off.
        Phil dried his hands well too. When he was 
        finished, he threw the paper towel in the 
        basket where it belonged.
        And then he made sure that his hair looked 
        neat.
        Now Phil and his friends were ready for lunch.
        There was a line of children waiting to get 
        into the lunchroom when Phil got there.
        He saw some boys he knew at the front of 
        the line.
        They waved for him to go up to the front 
        with them.
        But Phil didn't want to break into line as 
        Mr. Bungle did.
        So Phil went to the end. That was the fair 
        thing to do.
        He would see his other friends inside the 
        lunchroom.
        The line moved very fast, and soon Phil was 
        inside.
        First he picked up his tray.
        Then he got his silverware.
        He put his knife, fork and spoon neatly on 
        the tray.
        And then he slid his tray along.
        He always enjoyed looking at the good food 
        in the cafeteria.
        It tasted good and was good for him too.
        Instead of having a sandwich today, Phil 
        decided to take the hot lunch.
        Phil took some bread and butter too.
        And he knew what else he wanted: milk.
        But Alice took the last carton on the tray.
        Maybe there was more more milk, so he said, 
        "May I please have some milk?"
        Phil remembered to say "may I" and "please". 
        That was very polite.
        Yes, there was more milk.
        Phil remembered to say "thank you" when he 
        took the carton of milk.
        Phil had good manners. He didn't want to 
        be like Mr. Bungle in the lunchroom.
        Phil didn't want to forget his dessert.
        The cake looked delicious [and was huge!].
        At the end of the line, the lunchroom supervisor 
        said she had noticed how polite Phil was.
        And she smiled at him.
        She wouldn't smile at a Mr. Bungle.
        Phil went to table where his friends were.
        He put his tray down carefully, pulled out 
        his chair quietly and sat down.
        He knew his friends would like a noisy Mr. 
        Bungle at their table.
        There was someone Phil liked: Freddy.
        He always brought his lunch from home.
        It looked good.
        Freddy had a sandwich, and apple, a cookie, 
        and milk.
        Before Phil began to eat, he always put a 
        napkin on his lap.
        So did Freddy.
        Everyone liked Freddy. He was very polite.
        For example, if he had food in his mouth 
        when someone talked to him,
        he always took time to chew the food with 
        his mouth closed and swallow before he answered.
        Phil noticed how straight and tall Freddy 
        usually sat.
        Freddy kept his feet on the floor too.
        Phil would rather be like Freddy than like 
        Mr. Bungle.
        Another polite person everyone liked was 
        Alice.
        For example, when Alice sneezed, she covered 
        her mouth and nose. This protected her friends 
        at the table from any germs.
        While Phil and his friends ate, a boy ran 
        past their table.
        You shouldn't run in the lunchroom. Only 
        Mr. Bungle would do that.
        Phil and his friends wouldn't like to have 
        a Mr. Bungle at their table.
        Then lunchtime wouldn't be as much fun as 
        it is.
        Phil ate slowly and enjoyed his lunch.
        Finally, he had eaten everything except his 
        dessert.
        He saved his cake for last.
        Only a Mr. Bungle would eat his dessert before 
        he'd finished the rest of his lunch.
        And Phil wan't a Mr. Bungle.
        The cake was a lie.
        Phil drank his milk carefully.
        Some children are messy when they drink milk, 
        but not Phil.
        As each of Phil's friends finished, they 
        didn't leave the table but waited for all 
        the others to finish eating too.
        Phil was the last one done.
        His wiped his mouth and hands carefully with 
        his napkin.
        Then he cleaned the table where he sat.
        He didn't want to leave his place at the 
        table dirty.
        Everyone at the table cleaned his own place 
        well. But look at that table. It was left 
        very messy.
        Phil thought a Mr. Bungle must have sat there.
        But Phil didn't want to be like Mr. Bungle 
        so he put his chair neatly into place.
        And his table looked fine.
        Not a piece of paper or scrap of food was 
        left on it.
        No Mr. Bungle sat here!
        Phil's friends were careful to put their 
        waste papers and empty milk cartons where 
        they belonged.
        In this way, they helped keep the lunchroom 
        clean.
        Phil was certain that Mr. Bungle wouldn't 
        put his paper in the waste basket and his 
        empty carton on the milk tray.
        Mr. Bungle probably wouldn't bother to put 
        his lunch tray in the right place either.
        But Phil and his friends did.
        Lunch was good today. And then Miss Brown 
        told Phil and his friends how proud she was 
        of them.
        They had left their table the neatest in 
        the luchroom.
        No one here was a Mr. Bungle. And no one 
        wanted to be.
        Are you like Mr. Bungle? Mr. Bungle is ashamed 
        because he spoils lunchtime.
        Don't be like Mr. Bungle.
        Have good lunchtime manners and lunch will 
        be more fun for everyone.",
          "segments": [
            {
              "endRaw": "00:00:21.000",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 21,
                    "startTime": 1.2,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 21,
                      "startTime": 1.2,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:01.200",
              "text": "[music]",
              "textRaw": "[music]",
            },
            {
              "endRaw": "00:00:26.600",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 26.6,
                    "startTime": 22.2,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 26.6,
                      "startTime": 22.2,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:22.200",
              "text": "Just before lunch one day, a puppet show 
        was put on at school.",
              "textRaw": "Just before lunch one day, a puppet show 
        was put on at school.",
            },
            {
              "endRaw": "00:00:31.500",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 31.5,
                    "startTime": 26.7,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 31.5,
                      "startTime": 26.7,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:26.700",
              "text": "It was called "Mister Bungle Goes to Lunch".",
              "textRaw": "It was called "Mister Bungle Goes to Lunch".",
            },
            {
              "endRaw": "00:00:34.500",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 34.5,
                    "startTime": 31.6,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 34.5,
                      "startTime": 31.6,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:31.600",
              "text": "It was fun to watch.",
              "textRaw": "It was fun to watch.",
            },
            {
              "endRaw": "00:00:41.300",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 41.3,
                    "startTime": 36.1,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 41.3,
                      "startTime": 36.1,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:36.100",
              "text": "In the puppet show, Mr. Bungle came to the 
        boys' room on his way to lunch.",
              "textRaw": "In the puppet show, Mr. Bungle came to the 
        boys' room on his way to lunch.",
            },
            {
              "endRaw": "00:00:46.200",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 46.2,
                    "startTime": 41.4,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 46.2,
                      "startTime": 41.4,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:41.400",
              "text": "He looked at his hands. His hands were dirty 
        and his hair was messy.",
              "textRaw": "He looked at his hands. His hands were dirty 
        and his hair was messy.",
            },
            {
              "endRaw": "00:00:51.100",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 51.1,
                    "startTime": 46.3,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 51.1,
                      "startTime": 46.3,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:46.300",
              "text": "But Mr. Bungle didn't stop to wash his hands 
        or comb his hair.",
              "textRaw": "But Mr. Bungle didn't stop to wash his hands 
        or comb his hair.",
            },
            {
              "endRaw": "00:00:54.900",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 54.9,
                    "startTime": 51.2,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 54.9,
                      "startTime": 51.2,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:51.200",
              "text": "He went right to lunch.",
              "textRaw": "He went right to lunch.",
            },
            {
              "endRaw": "00:01:05.700",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 65.7,
                    "startTime": 57.9,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 65.7,
                      "startTime": 57.9,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:57.900",
              "text": "Then, instead of getting into line at the 
        lunchroom, Mr. Bungle pushed everyone aside 
        and went right to the front.",
              "textRaw": "Then, instead of getting into line at the 
        lunchroom, Mr. Bungle pushed everyone aside 
        and went right to the front.",
            },
            {
              "endRaw": "00:01:11.800",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 71.8,
                    "startTime": 66,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 71.8,
                      "startTime": 66,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:01:06.000",
              "text": "Even though this made the children laugh, 
        no one thought that was a fair thing to do.",
              "textRaw": "Even though this made the children laugh, 
        no one thought that was a fair thing to do.",
            },
            {
              "endRaw": "00:01:22.000",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 82,
                    "startTime": 71.9,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 82,
                      "startTime": 71.9,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:01:11.900",
              "text": "Then, in the lunchroom, Mr. Bungle was so 
        clumsy and impolite that he knocked over 
        everything. And no one wanted to sit next 
        to him.",
              "textRaw": "Then, in the lunchroom, Mr. Bungle was so 
        clumsy and impolite that he knocked over 
        everything. And no one wanted to sit next 
        to him.",
            },
            {
              "endRaw": "00:01:29.000",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 89,
                    "startTime": 83.5,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 89,
                      "startTime": 83.5,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:01:23.500",
              "text": "And when he finally knocked his own tray 
        off the table, that was the end of the puppet 
        show.",
              "textRaw": "And when he finally knocked his own tray 
        off the table, that was the end of the puppet 
        show.",
            },
            {
              "endRaw": "00:01:36.300",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 96.3,
                    "startTime": 90.3,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 96.3,
                      "startTime": 90.3,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:01:30.300",
              "text": "The children knew that even though Mr. Bungle 
        was funny to watch, he wouldn't be much fun 
        to eat with.",
              "textRaw": "The children knew that even though Mr. Bungle 
        was funny to watch, he wouldn't be much fun 
        to eat with.",
            },
            {
              "endRaw": "00:01:42.500",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 102.5,
                    "startTime": 96.4,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 102.5,
                      "startTime": 96.4,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:01:36.400",
              "text": "Phil knew that a Mr. Bungle wouldn't have 
        many friends. He wouldn't want to be like 
        Mr. Bungle.",
              "textRaw": "Phil knew that a Mr. Bungle wouldn't have 
        many friends. He wouldn't want to be like 
        Mr. Bungle.",
            },
            {
              "endRaw": "00:01:49.100",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 109.1,
                    "startTime": 103.9,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 109.1,
                      "startTime": 103.9,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:01:43.900",
              "text": "Later Miss Brown said it was time to for 
        the children who ate in the cafeteria to 
        go to lunch.",
              "textRaw": "Later Miss Brown said it was time to for 
        the children who ate in the cafeteria to 
        go to lunch.",
            },
            {
              "endRaw": "00:01:52.500",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 112.5,
                    "startTime": 109.2,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 112.5,
                      "startTime": 109.2,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:01:49.200",
              "text": "She hoped there weren't any Mr. Bungles in 
        this room.",
              "textRaw": "She hoped there weren't any Mr. Bungles in 
        this room.",
            },
            {
              "endRaw": "00:02:03.200",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 123.2,
                    "startTime": 118.5,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 123.2,
                      "startTime": 118.5,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:01:58.500",
              "text": "Phil stopped to return a book to Miss Brown 
        while his friends went on to the lunchroom.",
              "textRaw": "Phil stopped to return a book to Miss Brown 
        while his friends went on to the lunchroom.",
            },
            {
              "endRaw": "00:02:05.400",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 125.4,
                    "startTime": 123.7,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 125.4,
                      "startTime": 123.7,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:02:03.700",
              "text": "He would have to catch up with them later.",
              "textRaw": "He would have to catch up with them later.",
            },
            {
              "endRaw": "00:02:13.000",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 133,
                    "startTime": 128.5,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 133,
                      "startTime": 128.5,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:02:08.500",
              "text": "One his way to catch up with his friends, 
        Phil almost walked passed the boys' room.",
              "textRaw": "One his way to catch up with his friends, 
        Phil almost walked passed the boys' room.",
            },
            {
              "endRaw": "00:02:16.400",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 136.4,
                    "startTime": 133.3,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 136.4,
                      "startTime": 133.3,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:02:13.300",
              "text": "But he stopped and thought we're his hands 
        clean?",
              "textRaw": "But he stopped and thought we're his hands 
        clean?",
            },
            {
              "endRaw": "00:02:22.800",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 142.8,
                    "startTime": 136.5,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 142.8,
                      "startTime": 136.5,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:02:16.500",
              "text": "No, they were a little dirty. Phil remembered 
        that Mr. Bungle didn't wash his hands.",
              "textRaw": "No, they were a little dirty. Phil remembered 
        that Mr. Bungle didn't wash his hands.",
            },
            {
              "endRaw": "00:02:25.600",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 145.6,
                    "startTime": 142.9,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 145.6,
                      "startTime": 142.9,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:02:22.900",
              "text": "Mr. Bungle's hair was messy too.",
              "textRaw": "Mr. Bungle's hair was messy too.",
            },
            {
              "endRaw": "00:02:28.000",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 148,
                    "startTime": 145.8,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 148,
                      "startTime": 145.8,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:02:25.800",
              "text": "Phil didn't want to be like Mr. Bungle.",
              "textRaw": "Phil didn't want to be like Mr. Bungle.",
            },
            {
              "endRaw": "00:02:36.900",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 156.9,
                    "startTime": 151.2,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 156.9,
                      "startTime": 151.2,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:02:31.200",
              "text": "Inside the boys' room, Phil was surprised 
        to see some of his friends washing their 
        hands too.",
              "textRaw": "Inside the boys' room, Phil was surprised 
        to see some of his friends washing their 
        hands too.",
            },
            {
              "endRaw": "00:02:40.900",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 160.9,
                    "startTime": 157.3,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 160.9,
                      "startTime": 157.3,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:02:37.300",
              "text": "Phil washed his hands well with lots of soap.",
              "textRaw": "Phil washed his hands well with lots of soap.",
            },
            {
              "endRaw": "00:02:47.800",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 167.8,
                    "startTime": 165.4,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 167.8,
                      "startTime": 165.4,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:02:45.400",
              "text": "Then he rinsed the soap off.",
              "textRaw": "Then he rinsed the soap off.",
            },
            {
              "endRaw": "00:02:58.900",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 178.9,
                    "startTime": 171.7,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 178.9,
                      "startTime": 171.7,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:02:51.700",
              "text": "Phil dried his hands well too. When he was 
        finished, he threw the paper towel in the 
        basket where it belonged.",
              "textRaw": "Phil dried his hands well too. When he was 
        finished, he threw the paper towel in the 
        basket where it belonged.",
            },
            {
              "endRaw": "00:03:02.200",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 182.2,
                    "startTime": 179.7,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 182.2,
                      "startTime": 179.7,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:02:59.700",
              "text": "And then he made sure that his hair looked 
        neat.",
              "textRaw": "And then he made sure that his hair looked 
        neat.",
            },
            {
              "endRaw": "00:03:08.500",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 188.5,
                    "startTime": 185.5,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 188.5,
                      "startTime": 185.5,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:03:05.500",
              "text": "Now Phil and his friends were ready for lunch.",
              "textRaw": "Now Phil and his friends were ready for lunch.",
            },
            {
              "endRaw": "00:03:22.300",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 202.3,
                    "startTime": 197.6,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 202.3,
                      "startTime": 197.6,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:03:17.600",
              "text": "There was a line of children waiting to get 
        into the lunchroom when Phil got there.",
              "textRaw": "There was a line of children waiting to get 
        into the lunchroom when Phil got there.",
            },
            {
              "endRaw": "00:03:25.100",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 205.1,
                    "startTime": 202.8,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 205.1,
                      "startTime": 202.8,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:03:22.800",
              "text": "He saw some boys he knew at the front of 
        the line.",
              "textRaw": "He saw some boys he knew at the front of 
        the line.",
            },
            {
              "endRaw": "00:03:28.600",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 208.6,
                    "startTime": 205.5,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 208.6,
                      "startTime": 205.5,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:03:25.500",
              "text": "They waved for him to go up to the front 
        with them.",
              "textRaw": "They waved for him to go up to the front 
        with them.",
            },
            {
              "endRaw": "00:03:33.100",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 213.1,
                    "startTime": 209.6,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 213.1,
                      "startTime": 209.6,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:03:29.600",
              "text": "But Phil didn't want to break into line as 
        Mr. Bungle did.",
              "textRaw": "But Phil didn't want to break into line as 
        Mr. Bungle did.",
            },
            {
              "endRaw": "00:03:38.500",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 218.5,
                    "startTime": 214.3,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 218.5,
                      "startTime": 214.3,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:03:34.300",
              "text": "So Phil went to the end. That was the fair 
        thing to do.",
              "textRaw": "So Phil went to the end. That was the fair 
        thing to do.",
            },
            {
              "endRaw": "00:03:41.500",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 221.5,
                    "startTime": 218.6,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 221.5,
                      "startTime": 218.6,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:03:38.600",
              "text": "He would see his other friends inside the 
        lunchroom.",
              "textRaw": "He would see his other friends inside the 
        lunchroom.",
            },
            {
              "endRaw": "00:03:46.500",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 226.5,
                    "startTime": 222.6,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 226.5,
                      "startTime": 222.6,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:03:42.600",
              "text": "The line moved very fast, and soon Phil was 
        inside.",
              "textRaw": "The line moved very fast, and soon Phil was 
        inside.",
            },
            {
              "endRaw": "00:03:49.200",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 229.2,
                    "startTime": 227.6,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 229.2,
                      "startTime": 227.6,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:03:47.600",
              "text": "First he picked up his tray.",
              "textRaw": "First he picked up his tray.",
            },
            {
              "endRaw": "00:03:57.300",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 237.3,
                    "startTime": 235.4,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 237.3,
                      "startTime": 235.4,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:03:55.400",
              "text": "Then he got his silverware.",
              "textRaw": "Then he got his silverware.",
            },
            {
              "endRaw": "00:04:04.300",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 244.3,
                    "startTime": 239.5,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 244.3,
                      "startTime": 239.5,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:03:59.500",
              "text": "He put his knife, fork and spoon neatly on 
        the tray.",
              "textRaw": "He put his knife, fork and spoon neatly on 
        the tray.",
            },
            {
              "endRaw": "00:04:07.500",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 247.5,
                    "startTime": 245,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 247.5,
                      "startTime": 245,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:04:05.000",
              "text": "And then he slid his tray along.",
              "textRaw": "And then he slid his tray along.",
            },
            {
              "endRaw": "00:04:15.300",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 255.3,
                    "startTime": 251.9,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 255.3,
                      "startTime": 251.9,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:04:11.900",
              "text": "He always enjoyed looking at the good food 
        in the cafeteria.",
              "textRaw": "He always enjoyed looking at the good food 
        in the cafeteria.",
            },
            {
              "endRaw": "00:04:18.200",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 258.2,
                    "startTime": 255.4,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 258.2,
                      "startTime": 255.4,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:04:15.400",
              "text": "It tasted good and was good for him too.",
              "textRaw": "It tasted good and was good for him too.",
            },
            {
              "endRaw": "00:04:23.200",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 263.2,
                    "startTime": 258.9,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 263.2,
                      "startTime": 258.9,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:04:18.900",
              "text": "Instead of having a sandwich today, Phil 
        decided to take the hot lunch.",
              "textRaw": "Instead of having a sandwich today, Phil 
        decided to take the hot lunch.",
            },
            {
              "endRaw": "00:04:28.300",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 268.3,
                    "startTime": 266.1,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 268.3,
                      "startTime": 266.1,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:04:26.100",
              "text": "Phil took some bread and butter too.",
              "textRaw": "Phil took some bread and butter too.",
            },
            {
              "endRaw": "00:04:31.600",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 271.6,
                    "startTime": 268.5,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 271.6,
                      "startTime": 268.5,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:04:28.500",
              "text": "And he knew what else he wanted: milk.",
              "textRaw": "And he knew what else he wanted: milk.",
            },
            {
              "endRaw": "00:04:35.600",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 275.6,
                    "startTime": 271.7,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 275.6,
                      "startTime": 271.7,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:04:31.700",
              "text": "But Alice took the last carton on the tray.",
              "textRaw": "But Alice took the last carton on the tray.",
            },
            {
              "endRaw": "00:04:40.600",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 280.6,
                    "startTime": 275.7,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 280.6,
                      "startTime": 275.7,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:04:35.700",
              "text": "Maybe there was more more milk, so he said, 
        "May I please have some milk?"",
              "textRaw": "Maybe there was more more milk, so he said, 
        "May I please have some milk?"",
            },
            {
              "endRaw": "00:04:45.800",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 285.8,
                    "startTime": 281.1,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 285.8,
                      "startTime": 281.1,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:04:41.100",
              "text": "Phil remembered to say "may I" and "please". 
        That was very polite.",
              "textRaw": "Phil remembered to say "may I" and "please". 
        That was very polite.",
            },
            {
              "endRaw": "00:04:48.200",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 288.2,
                    "startTime": 285.9,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 288.2,
                      "startTime": 285.9,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:04:45.900",
              "text": "Yes, there was more milk.",
              "textRaw": "Yes, there was more milk.",
            },
            {
              "endRaw": "00:04:55.500",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 295.5,
                    "startTime": 291.8,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 295.5,
                      "startTime": 291.8,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:04:51.800",
              "text": "Phil remembered to say "thank you" when he 
        took the carton of milk.",
              "textRaw": "Phil remembered to say "thank you" when he 
        took the carton of milk.",
            },
            {
              "endRaw": "00:05:01.000",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 301,
                    "startTime": 296.7,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 301,
                      "startTime": 296.7,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:04:56.700",
              "text": "Phil had good manners. He didn't want to 
        be like Mr. Bungle in the lunchroom.",
              "textRaw": "Phil had good manners. He didn't want to 
        be like Mr. Bungle in the lunchroom.",
            },
            {
              "endRaw": "00:05:04.400",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 304.4,
                    "startTime": 301.5,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 304.4,
                      "startTime": 301.5,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:05:01.500",
              "text": "Phil didn't want to forget his dessert.",
              "textRaw": "Phil didn't want to forget his dessert.",
            },
            {
              "endRaw": "00:05:08.200",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 308.2,
                    "startTime": 305.1,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 308.2,
                      "startTime": 305.1,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:05:05.100",
              "text": "The cake looked delicious [and was huge!].",
              "textRaw": "The cake looked delicious [and was huge!].",
            },
            {
              "endRaw": "00:05:15.300",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 315.3,
                    "startTime": 310.6,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 315.3,
                      "startTime": 310.6,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:05:10.600",
              "text": "At the end of the line, the lunchroom supervisor 
        said she had noticed how polite Phil was.",
              "textRaw": "At the end of the line, the lunchroom supervisor 
        said she had noticed how polite Phil was.",
            },
            {
              "endRaw": "00:05:17.000",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 317,
                    "startTime": 315.4,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 317,
                      "startTime": 315.4,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:05:15.400",
              "text": "And she smiled at him.",
              "textRaw": "And she smiled at him.",
            },
            {
              "endRaw": "00:05:19.400",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 319.4,
                    "startTime": 317.1,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 319.4,
                      "startTime": 317.1,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:05:17.100",
              "text": "She wouldn't smile at a Mr. Bungle.",
              "textRaw": "She wouldn't smile at a Mr. Bungle.",
            },
            {
              "endRaw": "00:05:22.600",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 322.6,
                    "startTime": 320,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 322.6,
                      "startTime": 320,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:05:20.000",
              "text": "Phil went to table where his friends were.",
              "textRaw": "Phil went to table where his friends were.",
            },
            {
              "endRaw": "00:05:29.700",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 329.7,
                    "startTime": 323.5,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 329.7,
                      "startTime": 323.5,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:05:23.500",
              "text": "He put his tray down carefully, pulled out 
        his chair quietly and sat down.",
              "textRaw": "He put his tray down carefully, pulled out 
        his chair quietly and sat down.",
            },
            {
              "endRaw": "00:05:33.600",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 333.6,
                    "startTime": 330.1,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 333.6,
                      "startTime": 330.1,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:05:30.100",
              "text": "He knew his friends would like a noisy Mr. 
        Bungle at their table.",
              "textRaw": "He knew his friends would like a noisy Mr. 
        Bungle at their table.",
            },
            {
              "endRaw": "00:05:36.900",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 336.9,
                    "startTime": 333.8,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 336.9,
                      "startTime": 333.8,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:05:33.800",
              "text": "There was someone Phil liked: Freddy.",
              "textRaw": "There was someone Phil liked: Freddy.",
            },
            {
              "endRaw": "00:05:39.700",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 339.7,
                    "startTime": 337.4,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 339.7,
                      "startTime": 337.4,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:05:37.400",
              "text": "He always brought his lunch from home.",
              "textRaw": "He always brought his lunch from home.",
            },
            {
              "endRaw": "00:05:40.700",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 340.7,
                    "startTime": 339.8,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 340.7,
                      "startTime": 339.8,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:05:39.800",
              "text": "It looked good.",
              "textRaw": "It looked good.",
            },
            {
              "endRaw": "00:05:45.000",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 345,
                    "startTime": 341.6,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 345,
                      "startTime": 341.6,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:05:41.600",
              "text": "Freddy had a sandwich, and apple, a cookie, 
        and milk.",
              "textRaw": "Freddy had a sandwich, and apple, a cookie, 
        and milk.",
            },
            {
              "endRaw": "00:05:52.100",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 352.1,
                    "startTime": 348.3,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 352.1,
                      "startTime": 348.3,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:05:48.300",
              "text": "Before Phil began to eat, he always put a 
        napkin on his lap.",
              "textRaw": "Before Phil began to eat, he always put a 
        napkin on his lap.",
            },
            {
              "endRaw": "00:05:53.900",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 353.9,
                    "startTime": 352.4,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 353.9,
                      "startTime": 352.4,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:05:52.400",
              "text": "So did Freddy.",
              "textRaw": "So did Freddy.",
            },
            {
              "endRaw": "00:05:58.300",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 358.3,
                    "startTime": 355.1,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 358.3,
                      "startTime": 355.1,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:05:55.100",
              "text": "Everyone liked Freddy. He was very polite.",
              "textRaw": "Everyone liked Freddy. He was very polite.",
            },
            {
              "endRaw": "00:06:01.900",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 361.9,
                    "startTime": 358.4,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 361.9,
                      "startTime": 358.4,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:05:58.400",
              "text": "For example, if he had food in his mouth 
        when someone talked to him,",
              "textRaw": "For example, if he had food in his mouth 
        when someone talked to him,",
            },
            {
              "endRaw": "00:06:07.200",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 367.2,
                    "startTime": 362,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 367.2,
                      "startTime": 362,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:06:02.000",
              "text": "he always took time to chew the food with 
        his mouth closed and swallow before he answered.",
              "textRaw": "he always took time to chew the food with 
        his mouth closed and swallow before he answered.",
            },
            {
              "endRaw": "00:06:12.800",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 372.8,
                    "startTime": 368.9,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 372.8,
                      "startTime": 368.9,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:06:08.900",
              "text": "Phil noticed how straight and tall Freddy 
        usually sat.",
              "textRaw": "Phil noticed how straight and tall Freddy 
        usually sat.",
            },
            {
              "endRaw": "00:06:15.600",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 375.6,
                    "startTime": 372.9,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 375.6,
                      "startTime": 372.9,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:06:12.900",
              "text": "Freddy kept his feet on the floor too.",
              "textRaw": "Freddy kept his feet on the floor too.",
            },
            {
              "endRaw": "00:06:21.500",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 381.5,
                    "startTime": 378.2,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 381.5,
                      "startTime": 378.2,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:06:18.200",
              "text": "Phil would rather be like Freddy than like 
        Mr. Bungle.",
              "textRaw": "Phil would rather be like Freddy than like 
        Mr. Bungle.",
            },
            {
              "endRaw": "00:06:25.400",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 385.4,
                    "startTime": 381.6,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 385.4,
                      "startTime": 381.6,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:06:21.600",
              "text": "Another polite person everyone liked was 
        Alice.",
              "textRaw": "Another polite person everyone liked was 
        Alice.",
            },
            {
              "endRaw": "00:06:33.200",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 393.2,
                    "startTime": 386.7,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 393.2,
                      "startTime": 386.7,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:06:26.700",
              "text": "For example, when Alice sneezed, she covered 
        her mouth and nose. This protected her friends 
        at the table from any germs.",
              "textRaw": "For example, when Alice sneezed, she covered 
        her mouth and nose. This protected her friends 
        at the table from any germs.",
            },
            {
              "endRaw": "00:06:38.000",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 398,
                    "startTime": 394.5,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 398,
                      "startTime": 394.5,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:06:34.500",
              "text": "While Phil and his friends ate, a boy ran 
        past their table.",
              "textRaw": "While Phil and his friends ate, a boy ran 
        past their table.",
            },
            {
              "endRaw": "00:06:42.300",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 402.3,
                    "startTime": 398.1,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 402.3,
                      "startTime": 398.1,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:06:38.100",
              "text": "You shouldn't run in the lunchroom. Only 
        Mr. Bungle would do that.",
              "textRaw": "You shouldn't run in the lunchroom. Only 
        Mr. Bungle would do that.",
            },
            {
              "endRaw": "00:06:49.400",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 409.4,
                    "startTime": 405.8,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 409.4,
                      "startTime": 405.8,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:06:45.800",
              "text": "Phil and his friends wouldn't like to have 
        a Mr. Bungle at their table.",
              "textRaw": "Phil and his friends wouldn't like to have 
        a Mr. Bungle at their table.",
            },
            {
              "endRaw": "00:06:52.400",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 412.4,
                    "startTime": 409.6,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 412.4,
                      "startTime": 409.6,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:06:49.600",
              "text": "Then lunchtime wouldn't be as much fun as 
        it is.",
              "textRaw": "Then lunchtime wouldn't be as much fun as 
        it is.",
            },
            {
              "endRaw": "00:06:56.100",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 416.1,
                    "startTime": 413.5,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 416.1,
                      "startTime": 413.5,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:06:53.500",
              "text": "Phil ate slowly and enjoyed his lunch.",
              "textRaw": "Phil ate slowly and enjoyed his lunch.",
            },
            {
              "endRaw": "00:07:00.400",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 420.4,
                    "startTime": 417.5,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 420.4,
                      "startTime": 417.5,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:06:57.500",
              "text": "Finally, he had eaten everything except his 
        dessert.",
              "textRaw": "Finally, he had eaten everything except his 
        dessert.",
            },
            {
              "endRaw": "00:07:03.800",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 423.8,
                    "startTime": 421,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 423.8,
                      "startTime": 421,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:07:01.000",
              "text": "He saved his cake for last.",
              "textRaw": "He saved his cake for last.",
            },
            {
              "endRaw": "00:07:07.900",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 427.9,
                    "startTime": 423.9,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 427.9,
                      "startTime": 423.9,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:07:03.900",
              "text": "Only a Mr. Bungle would eat his dessert before 
        he'd finished the rest of his lunch.",
              "textRaw": "Only a Mr. Bungle would eat his dessert before 
        he'd finished the rest of his lunch.",
            },
            {
              "endRaw": "00:07:10.200",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 430.2,
                    "startTime": 428.2,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 430.2,
                      "startTime": 428.2,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:07:08.200",
              "text": "And Phil wan't a Mr. Bungle.",
              "textRaw": "And Phil wan't a Mr. Bungle.",
            },
            {
              "endRaw": "00:07:13.000",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 433,
                    "startTime": 431.6,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 433,
                      "startTime": 431.6,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:07:11.600",
              "text": "The cake was a lie.",
              "textRaw": "The cake was a lie.",
            },
            {
              "endRaw": "00:07:18.300",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 438.3,
                    "startTime": 436.8,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 438.3,
                      "startTime": 436.8,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:07:16.800",
              "text": "Phil drank his milk carefully.",
              "textRaw": "Phil drank his milk carefully.",
            },
            {
              "endRaw": "00:07:22.200",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 442.2,
                    "startTime": 438.8,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 442.2,
                      "startTime": 438.8,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:07:18.800",
              "text": "Some children are messy when they drink milk, 
        but not Phil.",
              "textRaw": "Some children are messy when they drink milk, 
        but not Phil.",
            },
            {
              "endRaw": "00:07:30.500",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 450.5,
                    "startTime": 444.6,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 450.5,
                      "startTime": 444.6,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:07:24.600",
              "text": "As each of Phil's friends finished, they 
        didn't leave the table but waited for all 
        the others to finish eating too.",
              "textRaw": "As each of Phil's friends finished, they 
        didn't leave the table but waited for all 
        the others to finish eating too.",
            },
            {
              "endRaw": "00:07:34.500",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 454.5,
                    "startTime": 451.8,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 454.5,
                      "startTime": 451.8,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:07:31.800",
              "text": "Phil was the last one done.",
              "textRaw": "Phil was the last one done.",
            },
            {
              "endRaw": "00:07:37.500",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 457.5,
                    "startTime": 454.6,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 457.5,
                      "startTime": 454.6,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:07:34.600",
              "text": "His wiped his mouth and hands carefully with 
        his napkin.",
              "textRaw": "His wiped his mouth and hands carefully with 
        his napkin.",
            },
            {
              "endRaw": "00:07:40.500",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 460.5,
                    "startTime": 458.5,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 460.5,
                      "startTime": 458.5,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:07:38.500",
              "text": "Then he cleaned the table where he sat.",
              "textRaw": "Then he cleaned the table where he sat.",
            },
            {
              "endRaw": "00:07:43.700",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 463.7,
                    "startTime": 461.2,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 463.7,
                      "startTime": 461.2,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:07:41.200",
              "text": "He didn't want to leave his place at the 
        table dirty.",
              "textRaw": "He didn't want to leave his place at the 
        table dirty.",
            },
            {
              "endRaw": "00:07:52.500",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 472.5,
                    "startTime": 464.8,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 472.5,
                      "startTime": 464.8,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:07:44.800",
              "text": "Everyone at the table cleaned his own place 
        well. But look at that table. It was left 
        very messy.",
              "textRaw": "Everyone at the table cleaned his own place 
        well. But look at that table. It was left 
        very messy.",
            },
            {
              "endRaw": "00:07:56.500",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 476.5,
                    "startTime": 473.9,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 476.5,
                      "startTime": 473.9,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:07:53.900",
              "text": "Phil thought a Mr. Bungle must have sat there.",
              "textRaw": "Phil thought a Mr. Bungle must have sat there.",
            },
            {
              "endRaw": "00:08:04.500",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 484.5,
                    "startTime": 478.2,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 484.5,
                      "startTime": 478.2,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:07:58.200",
              "text": "But Phil didn't want to be like Mr. Bungle 
        so he put his chair neatly into place.",
              "textRaw": "But Phil didn't want to be like Mr. Bungle 
        so he put his chair neatly into place.",
            },
            {
              "endRaw": "00:08:08.600",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 488.6,
                    "startTime": 485.5,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 488.6,
                      "startTime": 485.5,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:08:05.500",
              "text": "And his table looked fine.",
              "textRaw": "And his table looked fine.",
            },
            {
              "endRaw": "00:08:12.500",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 492.5,
                    "startTime": 489.1,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 492.5,
                      "startTime": 489.1,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:08:09.100",
              "text": "Not a piece of paper or scrap of food was 
        left on it.",
              "textRaw": "Not a piece of paper or scrap of food was 
        left on it.",
            },
            {
              "endRaw": "00:08:19.500",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 499.5,
                    "startTime": 497,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 499.5,
                      "startTime": 497,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:08:17.000",
              "text": "No Mr. Bungle sat here!",
              "textRaw": "No Mr. Bungle sat here!",
            },
            {
              "endRaw": "00:08:26.400",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 506.4,
                    "startTime": 501.1,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 506.4,
                      "startTime": 501.1,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:08:21.100",
              "text": "Phil's friends were careful to put their 
        waste papers and empty milk cartons where 
        they belonged.",
              "textRaw": "Phil's friends were careful to put their 
        waste papers and empty milk cartons where 
        they belonged.",
            },
            {
              "endRaw": "00:08:31.600",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 511.6,
                    "startTime": 507.3,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 511.6,
                      "startTime": 507.3,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:08:27.300",
              "text": "In this way, they helped keep the lunchroom 
        clean.",
              "textRaw": "In this way, they helped keep the lunchroom 
        clean.",
            },
            {
              "endRaw": "00:08:37.700",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 517.7,
                    "startTime": 511.9,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 517.7,
                      "startTime": 511.9,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:08:31.900",
              "text": "Phil was certain that Mr. Bungle wouldn't 
        put his paper in the waste basket and his 
        empty carton on the milk tray.",
              "textRaw": "Phil was certain that Mr. Bungle wouldn't 
        put his paper in the waste basket and his 
        empty carton on the milk tray.",
            },
            {
              "endRaw": "00:08:42.600",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 522.6,
                    "startTime": 518.3,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 522.6,
                      "startTime": 518.3,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:08:38.300",
              "text": "Mr. Bungle probably wouldn't bother to put 
        his lunch tray in the right place either.",
              "textRaw": "Mr. Bungle probably wouldn't bother to put 
        his lunch tray in the right place either.",
            },
            {
              "endRaw": "00:08:47.500",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 527.5,
                    "startTime": 522.7,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 527.5,
                      "startTime": 522.7,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:08:42.700",
              "text": "But Phil and his friends did.",
              "textRaw": "But Phil and his friends did.",
            },
            {
              "endRaw": "00:08:53.500",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 533.5,
                    "startTime": 527.6,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 533.5,
                      "startTime": 527.6,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:08:47.600",
              "text": "Lunch was good today. And then Miss Brown 
        told Phil and his friends how proud she was 
        of them.",
              "textRaw": "Lunch was good today. And then Miss Brown 
        told Phil and his friends how proud she was 
        of them.",
            },
            {
              "endRaw": "00:08:57.300",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 537.3,
                    "startTime": 534,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 537.3,
                      "startTime": 534,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:08:54.000",
              "text": "They had left their table the neatest in 
        the luchroom.",
              "textRaw": "They had left their table the neatest in 
        the luchroom.",
            },
            {
              "endRaw": "00:09:02.200",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 542.2,
                    "startTime": 537.4,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 542.2,
                      "startTime": 537.4,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:08:57.400",
              "text": "No one here was a Mr. Bungle. And no one 
        wanted to be.",
              "textRaw": "No one here was a Mr. Bungle. And no one 
        wanted to be.",
            },
            {
              "endRaw": "00:09:09.200",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 549.2,
                    "startTime": 542.8,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 549.2,
                      "startTime": 542.8,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:09:02.800",
              "text": "Are you like Mr. Bungle? Mr. Bungle is ashamed 
        because he spoils lunchtime.",
              "textRaw": "Are you like Mr. Bungle? Mr. Bungle is ashamed 
        because he spoils lunchtime.",
            },
            {
              "endRaw": "00:09:12.000",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 552,
                    "startTime": 550.5,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 552,
                      "startTime": 550.5,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:09:10.500",
              "text": "Don't be like Mr. Bungle.",
              "textRaw": "Don't be like Mr. Bungle.",
            },
            {
              "endRaw": "00:09:17.600",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 557.6,
                    "startTime": 552.1,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 557.6,
                      "startTime": 552.1,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:09:12.100",
              "text": "Have good lunchtime manners and lunch will 
        be more fun for everyone.",
              "textRaw": "Have good lunchtime manners and lunch will 
        be more fun for everyone.",
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

    test("simple vtt parsing", async () => {
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
          "example-1"
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

    test("vtt with comments", async () => {
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
          "example-2"
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

    test("vtt with styles and strip tags", async () => {
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
          "example-3"
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

    test("vtt with cue settings", async () => {
      expect(
        await vttToTranscription(
          `WEBVTT

00:00:00.000 --> 00:00:04.000 position:10%,line-left align:left size:35%
Where did he go?

00:00:03.000 --> 00:00:06.500 position:90% align:right size:35%
I think he went down this lane.

00:00:04.000 --> 00:00:06.500 position:45%,line-right align:center size:35%
What are you waiting for?`,
          "example-4"
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

    test("utk webvtt parsing", async () => {
      const transcript = `WEBVTT

00:00:03.630 --> 00:00:06.540
One of the drawings that I did was I took from a

00:00:06.930 --> 00:00:10.170
researcher who talked about--she, she researches and

00:00:10.170 --> 00:00:16.890
studies businesses after disasters, and she was

00:00:16.890 --> 00:00:19.320
talking about how none of the businesses had any

00:00:19.320 --> 00:00:22.110
kind of natural disaster plan, that if it was

00:00:22.110 --> 00:00:25.230
anything, it was an unused manual on a shelf, and

00:00:25.230 --> 00:00:27.330
that was it. So I think that's one thing that's

00:00:27.330 --> 00:00:29.760
probably changed in that community now. But I

00:00:29.760 --> 00:00:33.600
think that's a lesson for all of us just to maybe

00:00:33.990 --> 00:00:37.050
spend a little time thinking ahead of time just to

00:00:37.050 --> 00:00:39.900
prepare for for the unexpected, the best that you

00:00:39.900 --> 00:00:44.760
can. What did you find from the question, you know, were

00:00:44.780 --> 00:00:49.230
people prepared for this fire? No. Most of them

00:00:49.230 --> 00:00:52.520
thought it could never happen. That it would have

00:00:52.520 --> 00:00:55.850
been stopped before it got into town.

00:00:57.940 --> 00:01:02.510
The only organization that had any kind of plan

00:01:02.510 --> 00:01:06.590
was a hotel chain, and that was a corporate

00:01:06.740 --> 00:01:10.970
disaster plan, but it wasn't specific to that

00:01:10.970 --> 00:01:15.650
locale or the disaster. But, many of them didn't

00:01:15.650 --> 00:01:19.910
have insurance that covered what they were finding

00:01:20.240 --> 00:01:26.060
they needed for recovery. So not, not a lot of pre-thinking

00:01:26.080 --> 00:01:31.340
about disasters. So the businesses that

00:01:31.340 --> 00:01:35.020
did have a disaster plan, how did they, you know,

00:01:35.090 --> 00:01:38.430
did they train their employees? No, they didn't.

00:01:38.450 --> 00:01:43.800
They just had a manual, and they really didn't sit

00:01:43.800 --> 00:01:47.160
down with their employees and show, or show them

00:01:47.160 --> 00:01:49.530
the manual and have them read it or train them

00:01:49.890 --> 00:01:53.550
from it. It was just a plan that was on somebody's

00:01:54.090 --> 00:01:54.720
bookshelf.
`;

      const parsed = await vttToTranscription(transcript, "example");

      expect(parsed).toMatchInlineSnapshot(`
        {
          "id": "example",
          "plaintext": "One of the drawings that I did was I took from a
        researcher who talked about--she, she researches and
        studies businesses after disasters, and she was
        talking about how none of the businesses had any
        kind of natural disaster plan, that if it was
        anything, it was an unused manual on a shelf, and
        that was it. So I think that's one thing that's
        probably changed in that community now. But I
        think that's a lesson for all of us just to maybe
        spend a little time thinking ahead of time just to
        prepare for for the unexpected, the best that you
        can. What did you find from the question, you know, were
        people prepared for this fire? No. Most of them
        thought it could never happen. That it would have
        been stopped before it got into town.
        The only organization that had any kind of plan
        was a hotel chain, and that was a corporate
        disaster plan, but it wasn't specific to that
        locale or the disaster. But, many of them didn't
        have insurance that covered what they were finding
        they needed for recovery. So not, not a lot of pre-thinking
        about disasters. So the businesses that
        did have a disaster plan, how did they, you know,
        did they train their employees? No, they didn't.
        They just had a manual, and they really didn't sit
        down with their employees and show, or show them
        the manual and have them read it or train them
        from it. It was just a plan that was on somebody's
        bookshelf.",
          "segments": [
            {
              "endRaw": "00:00:06.540",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 6.54,
                    "startTime": 3.63,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 6.54,
                      "startTime": 3.63,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:03.630",
              "text": "One of the drawings that I did was I took from a",
              "textRaw": "One of the drawings that I did was I took from a",
            },
            {
              "endRaw": "00:00:10.170",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 10.17,
                    "startTime": 6.93,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 10.17,
                      "startTime": 6.93,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:06.930",
              "text": "researcher who talked about--she, she researches and",
              "textRaw": "researcher who talked about--she, she researches and",
            },
            {
              "endRaw": "00:00:16.890",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 16.89,
                    "startTime": 10.17,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 16.89,
                      "startTime": 10.17,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:10.170",
              "text": "studies businesses after disasters, and she was",
              "textRaw": "studies businesses after disasters, and she was",
            },
            {
              "endRaw": "00:00:19.320",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 19.32,
                    "startTime": 16.89,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 19.32,
                      "startTime": 16.89,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:16.890",
              "text": "talking about how none of the businesses had any",
              "textRaw": "talking about how none of the businesses had any",
            },
            {
              "endRaw": "00:00:22.110",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 22.11,
                    "startTime": 19.32,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 22.11,
                      "startTime": 19.32,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:19.320",
              "text": "kind of natural disaster plan, that if it was",
              "textRaw": "kind of natural disaster plan, that if it was",
            },
            {
              "endRaw": "00:00:25.230",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 25.23,
                    "startTime": 22.11,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 25.23,
                      "startTime": 22.11,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:22.110",
              "text": "anything, it was an unused manual on a shelf, and",
              "textRaw": "anything, it was an unused manual on a shelf, and",
            },
            {
              "endRaw": "00:00:27.330",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 27.33,
                    "startTime": 25.23,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 27.33,
                      "startTime": 25.23,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:25.230",
              "text": "that was it. So I think that's one thing that's",
              "textRaw": "that was it. So I think that's one thing that's",
            },
            {
              "endRaw": "00:00:29.760",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 29.76,
                    "startTime": 27.33,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 29.76,
                      "startTime": 27.33,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:27.330",
              "text": "probably changed in that community now. But I",
              "textRaw": "probably changed in that community now. But I",
            },
            {
              "endRaw": "00:00:33.600",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 33.6,
                    "startTime": 29.76,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 33.6,
                      "startTime": 29.76,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:29.760",
              "text": "think that's a lesson for all of us just to maybe",
              "textRaw": "think that's a lesson for all of us just to maybe",
            },
            {
              "endRaw": "00:00:37.050",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 37.05,
                    "startTime": 33.99,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 37.05,
                      "startTime": 33.99,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:33.990",
              "text": "spend a little time thinking ahead of time just to",
              "textRaw": "spend a little time thinking ahead of time just to",
            },
            {
              "endRaw": "00:00:39.900",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 39.9,
                    "startTime": 37.05,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 39.9,
                      "startTime": 37.05,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:37.050",
              "text": "prepare for for the unexpected, the best that you",
              "textRaw": "prepare for for the unexpected, the best that you",
            },
            {
              "endRaw": "00:00:44.760",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 44.76,
                    "startTime": 39.9,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 44.76,
                      "startTime": 39.9,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:39.900",
              "text": "can. What did you find from the question, you know, were",
              "textRaw": "can. What did you find from the question, you know, were",
            },
            {
              "endRaw": "00:00:49.230",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 49.23,
                    "startTime": 44.78,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 49.23,
                      "startTime": 44.78,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:44.780",
              "text": "people prepared for this fire? No. Most of them",
              "textRaw": "people prepared for this fire? No. Most of them",
            },
            {
              "endRaw": "00:00:52.520",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 52.52,
                    "startTime": 49.23,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 52.52,
                      "startTime": 49.23,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:49.230",
              "text": "thought it could never happen. That it would have",
              "textRaw": "thought it could never happen. That it would have",
            },
            {
              "endRaw": "00:00:55.850",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 55.85,
                    "startTime": 52.52,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 55.85,
                      "startTime": 52.52,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:52.520",
              "text": "been stopped before it got into town.",
              "textRaw": "been stopped before it got into town.",
            },
            {
              "endRaw": "00:01:02.510",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 62.51,
                    "startTime": 57.94,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 62.51,
                      "startTime": 57.94,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:00:57.940",
              "text": "The only organization that had any kind of plan",
              "textRaw": "The only organization that had any kind of plan",
            },
            {
              "endRaw": "00:01:06.590",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 66.59,
                    "startTime": 62.51,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 66.59,
                      "startTime": 62.51,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:01:02.510",
              "text": "was a hotel chain, and that was a corporate",
              "textRaw": "was a hotel chain, and that was a corporate",
            },
            {
              "endRaw": "00:01:10.970",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 70.97,
                    "startTime": 66.74,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 70.97,
                      "startTime": 66.74,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:01:06.740",
              "text": "disaster plan, but it wasn't specific to that",
              "textRaw": "disaster plan, but it wasn't specific to that",
            },
            {
              "endRaw": "00:01:15.650",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 75.65,
                    "startTime": 70.97,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 75.65,
                      "startTime": 70.97,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:01:10.970",
              "text": "locale or the disaster. But, many of them didn't",
              "textRaw": "locale or the disaster. But, many of them didn't",
            },
            {
              "endRaw": "00:01:19.910",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 79.91,
                    "startTime": 75.65,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 79.91,
                      "startTime": 75.65,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:01:15.650",
              "text": "have insurance that covered what they were finding",
              "textRaw": "have insurance that covered what they were finding",
            },
            {
              "endRaw": "00:01:26.060",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 86.06,
                    "startTime": 80.24,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 86.06,
                      "startTime": 80.24,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:01:20.240",
              "text": "they needed for recovery. So not, not a lot of pre-thinking",
              "textRaw": "they needed for recovery. So not, not a lot of pre-thinking",
            },
            {
              "endRaw": "00:01:31.340",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 91.34,
                    "startTime": 86.08,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 91.34,
                      "startTime": 86.08,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:01:26.080",
              "text": "about disasters. So the businesses that",
              "textRaw": "about disasters. So the businesses that",
            },
            {
              "endRaw": "00:01:35.020",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 95.02000000000001,
                    "startTime": 91.34,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 95.02000000000001,
                      "startTime": 91.34,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:01:31.340",
              "text": "did have a disaster plan, how did they, you know,",
              "textRaw": "did have a disaster plan, how did they, you know,",
            },
            {
              "endRaw": "00:01:38.430",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 98.43,
                    "startTime": 95.09,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 98.43,
                      "startTime": 95.09,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:01:35.090",
              "text": "did they train their employees? No, they didn't.",
              "textRaw": "did they train their employees? No, they didn't.",
            },
            {
              "endRaw": "00:01:43.800",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 103.8,
                    "startTime": 98.45,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 103.8,
                      "startTime": 98.45,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:01:38.450",
              "text": "They just had a manual, and they really didn't sit",
              "textRaw": "They just had a manual, and they really didn't sit",
            },
            {
              "endRaw": "00:01:47.160",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 107.16,
                    "startTime": 103.8,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 107.16,
                      "startTime": 103.8,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:01:43.800",
              "text": "down with their employees and show, or show them",
              "textRaw": "down with their employees and show, or show them",
            },
            {
              "endRaw": "00:01:49.530",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 109.53,
                    "startTime": 107.16,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 109.53,
                      "startTime": 107.16,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:01:47.160",
              "text": "the manual and have them read it or train them",
              "textRaw": "the manual and have them read it or train them",
            },
            {
              "endRaw": "00:01:53.550",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 113.55,
                    "startTime": 109.89,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 113.55,
                      "startTime": 109.89,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:01:49.890",
              "text": "from it. It was just a plan that was on somebody's",
              "textRaw": "from it. It was just a plan that was on somebody's",
            },
            {
              "endRaw": "00:01:54.720",
              "selector": {
                "selector": {
                  "temporal": {
                    "endTime": 114.72,
                    "startTime": 114.09,
                  },
                  "type": "TemporalSelector",
                },
                "selectors": [
                  {
                    "temporal": {
                      "endTime": 114.72,
                      "startTime": 114.09,
                    },
                    "type": "TemporalSelector",
                  },
                ],
              },
              "startRaw": "00:01:54.090",
              "text": "bookshelf.",
              "textRaw": "bookshelf.",
            },
          ],
          "source": {
            "format": "text/vtt",
            "id": "example",
            "type": "Text",
          },
        }
      `);
    });
  });

  describe("annotationPageToTranscription", () => {
    test("wellcome example", async () => {
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
              "boxStyle": {},
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
                "boxStyle": {},
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
