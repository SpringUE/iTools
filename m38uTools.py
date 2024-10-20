import os
import time
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad
from Crypto.Util.strxor import strxor

import ffmpeg  
import glob  
 
def legth(value):
    l = len(value)
    flag = l % 16
    if flag != 0:
        add = 16 - (l % 16)
        value = value + ('\0' * add).encode('utf-8')
    # return value
 
# 解密单个文件
def decryptFile(inputFile, outputFile, key, iv):
    # 读取ts文件的内容
    with open(inputFile, 'rb') as f:
        data = f.read()
    
    # 使用AES解密
    cipher = AES.new(key, AES.MODE_CBC, iv)
    decrypted_data = cipher.decrypt(data)
    
    # 去除填充
    decrypted_data = pad(decrypted_data, AES.block_size, 'pkcs7')
    
    # 将解密后的数据写入文件
    with open(outputFile, 'wb') as f:
        f.write(decrypted_data)

"""  
打印进度信息  
@params:  
    iteration   - Required  : current iteration (Int)  
    total       - Required  : total iterations (Int)  
    prefix      - Optional  : prefix string (Str)  
    suffix      - Optional  : suffix string (Str)  
    decimals    - Optional  : positive number of decimals in percent complete (Int)  
    length      - Optional  : character length of bar (Int)  
    fill        - Optional  : bar fill character (Str)  
"""  
def print_progress(iteration, total, prefix='', suffix='', decimals=1, length=100, fill='█'):  
    percent = ("{0:." + str(decimals) + "f}").format(100 * (iteration / float(total)))  
    filled_length = int(length * iteration // total)  
    bar = fill * filled_length + '-' * (length - filled_length)  
    print(f'\r{prefix}{bar} {percent}% {suffix} ', end="")  
    # Flush stdout so the user can see the updated progress bar immediately  
    import sys  
    sys.stdout.flush()  
    

def getFloderTsFileNames(folderName):
    return glob.glob(os.path.join(folderName, '*.ts'))  

    
# 将解密后的小文件合并
def merge(folderName):
    # 设置输入和输出文件的路径  
    input_folder = folderName+ '/decrypted'  # ts文件所在的文件夹路径  
    output_file = folderName+ '/merge.ts'  # 输出的mp4文件名  
    input_list = 'input_list'+ folderName +'.txt'
    
    # 获取所有的ts文件  
    ts_files = getFloderTsFileNames(input_folder)
    
    # 确保至少有一个ts文件  
    if not ts_files:  
        print("没有找到ts文件。")  
        exit(1)  
    
    # 创建一个文本文件，其中包含所有ts文件的列表，用于ffmpeg的concat协议  
    with open(input_list, 'w') as f:  
        for ts_file in ts_files:  
            f.write("file '{}'\n".format(ts_file))  
    
    # 使用ffmpeg的concat协议来合并文件  
    (  
        ffmpeg  
        .input(input_list, format='concat', safe=0)  
        # .output(output_file, vcodec='libx264', acodec='aac')  
        .output(output_file, vcodec='copy', acodec='copy')  # 假设编码兼容，直接复制流
        .run()  
    )  
    
    # 删除临时创建的输入列表文件  
    os.remove(input_list) 
    
    print(f"{output_file} 转换完成!")


# 解密单个文件夹
def decrypt(): 
    # 提示用户输入
    folderNames = input("请输入一个以上的文件夹名，英文逗号分隔: ")  
    
    # 打印出用户输入
    print("解密的文件夹： " + folderNames + "")

    folderNamesArr = folderNames.split(',')
    totalFolder = len(folderNamesArr)
    
    for folderName in folderNamesArr:
        ts_files = getFloderTsFileNames(folderName+ '/index')
        total = len(ts_files)
        # 密钥和初始向量应该是二进制数据，可以根据实际情况进行转换
        # key = b'C1g5cGA14a31050c'
        iv = legth(b'0x00000000000000000000000000000000')
        # 读取密钥
        with open(folderName +'/index/0.key', 'rb') as f:
            key = f.read()
    
        # 检查文件所在的文件夹是否存在，如果不存在则创建  
        dir_name = './'+ folderName +'/decrypted'
        if not os.path.exists(dir_name):  
            os.makedirs(dir_name) 
        
        print('开始解密: '+ folderName)
        for i, value in enumerate(ts_files):
            # 要解密的ts文件名
            outputFile = value.replace('index','decrypted')

            decryptFile(value, outputFile, key, iv)
            print_progress(i + 1, total, prefix='进度:', suffix='当前:'+ value, length=30)  
    
        merge(folderName)
        print('')
        print('"'+ folderName +'"文件夹解密完成')
        
    
    print('任务全部执行完毕，共解密'+ str(totalFolder) +'个文件夹')





# 解密小文件
decrypt()



